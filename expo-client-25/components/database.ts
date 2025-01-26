// components/database.ts
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import * as SQLite from "expo-sqlite";

interface StationData {
  name: string;
  mean: number;
  stdDev: number;
  prod: number;
}

class Database {
  private db: SQLite.WebSQLDatabase | null = null;

  async loadDatabase(): Promise<void> {
    try {
      // Get the database file path
      const dbName = "halfway.db";
      const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
      const dbPath = `${dbDirectory}/${dbName}`;

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDirectory);
      }

      // Check if database already exists
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        // If it doesn't exist, copy it from assets
        const asset = Asset.fromModule(require("../assets/halfway.db"));
        await Asset.loadAsync(asset);
        await FileSystem.downloadAsync(asset.uri, dbPath);
      }

      // Open the database
      this.db = SQLite.openDatabaseSync(dbName);

      // Verify the database was opened successfully
      if (!this.db) {
        throw new Error("Database failed to open");
      }

      // Test the connection
      await this.testDatabaseConnection();
      console.log("Database loaded successfully");
    } catch (error) {
      console.error("Error in loadDatabase:", error);
      throw error;
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise<void>((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            "SELECT 1",
            [],
            () => {
              console.log("Database connection verified");
              resolve();
            },
            (_, error) => {
              console.error("SQL Error in test:", error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error("Transaction Error in test:", error);
          reject(error);
        },
      );
    });
  }

  async getStationsAsync(): Promise<any> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            "SELECT * FROM STATIONS;",
            [],
            (_, result) => resolve(result),
            (_, error) => {
              console.error("Error getting stations:", error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          reject(error);
        },
      );
    });
  }

  private average(data: number[]): number {
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }

  private standardDeviation(values: number[]): number {
    const avg = this.average(values);
    const squareDiffs = values.map((value) => {
      const diff = value - avg;
      return diff * diff;
    });
    return Math.sqrt(this.average(squareDiffs));
  }

  private processWeights(
    destinations: Record<string, number[]>,
  ): StationData[] {
    return Object.entries(destinations).map(([name, places]) => {
      const meanVal = this.average(places);
      const stdDevVal = this.standardDeviation(places);
      return {
        name,
        mean: meanVal,
        stdDev: stdDevVal,
        prod: meanVal + 2 * stdDevVal,
      };
    });
  }

  private async stationNameFromCode(code: string): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          "SELECT name FROM stations WHERE code = ?",
          [code],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(result.rows.item(0).name);
            } else {
              reject(new Error("Station not found"));
            }
          },
          (_, error) => {
            reject(error);
            return false;
          },
        );
      });
    });
  }

  private async getTop(
    values: StationData[],
    callback: (result: string) => void,
  ): Promise<void> {
    // Sort by prod value (mean + 2*stdDev)
    values.sort((a, b) => a.prod - b.prod);

    let result = "";
    const topThree = values.slice(0, 3);

    for (const option of topThree) {
      try {
        const fullName = await this.stationNameFromCode(option.name);
        result += `${fullName}\n${option.mean.toFixed(1)} ± ${(2 * option.stdDev).toFixed(1)} minutes\n\n`;
      } catch (error) {
        console.error("Error getting station name:", error);
      }
    }

    callback(result);
  }

  async fairestStation(
    startingFrom: string[],
    callback: (result: string) => void,
  ): Promise<void> {
    if (!this.db || startingFrom.length === 0) {
      callback("Please select stations");
      return;
    }

    try {
      const placeholders = startingFrom.map(() => "?").join(" OR stationa = ");
      const sql = `
        SELECT stationb, weight
        FROM fullroutes
        WHERE weight < 10000.0
        AND (stationa = ${placeholders})
      `;

      this.db.transaction((tx) => {
        tx.executeSql(
          sql,
          startingFrom,
          (_, resultSet) => {
            const destinations: Record<string, number[]> = {};

            for (let i = 0; i < resultSet.rows.length; i++) {
              const row = resultSet.rows.item(i);
              if (!destinations[row.stationb]) {
                destinations[row.stationb] = [];
              }
              destinations[row.stationb].push(row.weight);
            }

            const sortable = this.processWeights(destinations);
            this.getTop(sortable, callback);
          },
          (_, error) => {
            console.error("SQL Error:", error);
            callback("Error calculating fairest station");
            return false;
          },
        );
      });
    } catch (error) {
      console.error("Error in fairestStation:", error);
      callback("An error occurred");
    }
  }
}

export const database = new Database();
