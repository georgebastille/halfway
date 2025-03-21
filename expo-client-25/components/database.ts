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
	private db: SQLite.SQLiteDatabase | null = null;

	async loadDatabase(): Promise<void> {
		try {
			// Get the database file path
			const dbName = "halfway2.db";
			const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
			const dbPath = `${dbDirectory}/${dbName}`;
			await FileSystem.deleteAsync(dbPath, { idempotent: true, });
			await FileSystem.deleteAsync(dbDirectory, { idempotent: true, });

			await FileSystem.makeDirectoryAsync(dbDirectory);
			const asset = Asset.fromModule(require("../assets/halfway2.db"));
			await Asset.loadAsync(asset);
			await FileSystem.downloadAsync(asset.uri, dbPath);

			// Open the database
			this.db = await SQLite.openDatabaseAsync(dbName);

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

		try {
			const result = await this.db.getFirstAsync("SELECT 1");
			console.log("Database connection verified", result);
		} catch (error) {
			console.error("SQL Error in test:", error);
			throw error;
		}
	}

	async getStationsAsync(): Promise<any> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}

		try {
			const result = await this.db.getAllAsync("SELECT * FROM STATIONS;");
			return result;
		} catch (error) {
			console.error("Error getting stations:", error);
			throw error;
		}
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
				//prod: meanVal + 2 * stdDevVal,
				prod: meanVal + 0.1 * stdDevVal,
			};
		});
	}
	private async stationNameFromCode(code: string): Promise<string> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}
		if (!code) {
			return "No station selected";
		}

		try {
			const result = await this.db.getFirstAsync<{ NAME: string }>(
				"SELECT NAME FROM STATIONS WHERE CODE = ?",
					[code],
			);
			if (result) {
				return result.NAME;
			} else {
				return "Station not found";
			}
		} catch (error) {
			console.error("Error getting station name:", error);
			return "Error finding station";
		}
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

				// Filter out null or undefined values
				const validStations = startingFrom.filter((station) => station != null);

				if (validStations.length === 0) {
					callback("Please select valid stations");
					return;
				}

				try {
					const placeholders = validStations.map(() => "?").join(" OR stationa = ");
					const sql = `
					SELECT stationb, weight
					FROM fullroutes
					WHERE weight < 10000.0
					AND (stationa = ${placeholders})
					`;

					const resultSet = await this.db.getAllAsync(sql, validStations);
					console.log("SQL", sql);
					console.log("SQL Results: ", resultSet)

					if (!resultSet || resultSet.length === 0) {
						callback("No valid routes found");
						return;
					}

					const destinations: Record<string, number[]> = {};

					for (const row of resultSet) {
						if (!destinations[row.STATIONB]) {
							destinations[row.STATIONB] = [];
						}
						destinations[row.STATIONB].push(row.WEIGHT);
					}

		
					console.log("Destinations: ", destinations);

					const sortable = this.processWeights(destinations);
					await this.getTop(sortable, callback);
				} catch (error) {
					console.error("Error in fairestStation:", error);
					callback("An error occurred while finding stations");
				}
			}
}

export const database = new Database();
