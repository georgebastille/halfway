package com.elixr.halfwayhouse;


import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Criteria;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.StrictMode;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONArray;
import org.json.JSONException;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MapActivity extends Activity
{

    GoogleMap mMap;
    List<EditText> locationFields;
    JSONArray jsonLocations;
    EditText locationEntry;
    Marker resultLocation;
    final Object syncLock = new Object();

    Geocoder geocoder;

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        setContentView(R.layout.activity_map);

        setUpMapIfNeeded();

        locationFields = new ArrayList<>();
        geocoder = new Geocoder(getBaseContext(), Locale.getDefault());

        jsonLocations = new JSONArray();

        locationEntry = ((EditText) findViewById(R.id.address1EditText));


        final Button addLocationButton = (Button) findViewById(R.id.buttonAdd);
        addLocationButton.setOnClickListener(new View.OnClickListener()
        {
            @Override
            public void onClick(View view)
            {
                new LocationDetective().execute(locationEntry.getText().toString());
            }
        });

        final Button deployButton = (Button) findViewById(R.id.buttonDeploy);
        deployButton.setOnClickListener(new View.OnClickListener()
        {
            public void onClick(View v)
            {
                new AlgorithmExecutor().execute();
            }
        });
    }

    private void setUpMapIfNeeded()
    {
        // Do a null check to confirm that we have not already instantiated the map.
        if (mMap == null)
        {
            mMap = ((MapFragment) getFragmentManager().findFragmentById(R.id.map))
                    .getMap();
        }

        mMap.setMyLocationEnabled(true);

        LocationManager locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);

        // Create a criteria object to retrieve provider
        Criteria criteria = new Criteria();

        // Get the name of the best provider
        String provider = locationManager.getBestProvider(criteria, true);

        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED)
        {
            // TODO: Consider calling
            //    public void requestPermissions(@NonNull String[] permissions, int requestCode)
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for Activity#requestPermissions for more details.
            return;
        }
        Location myLocation = locationManager.getLastKnownLocation(provider);

        if (null != myLocation)
        {
            LatLng myLatLng = new LatLng(myLocation.getLatitude(), myLocation.getLongitude());
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(myLatLng, 13));
        }

        LatLng londonLatitudeLongitude = new LatLng(51.507351, -0.127758);
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(londonLatitudeLongitude, 12));

    }

    private class LocationDetective extends AsyncTask<String, Void, Void>
    {
        Address address;

        @Override
        protected Void doInBackground(String... strings)
        {
            if (strings.length >= 1)
            {
                String addressString = strings[0];

                if (null != addressString && !addressString.isEmpty())
                {
                    try
                    {
                        address = geocoder.getFromLocationName(addressString, 1).get(0);
                    } catch (IOException e)
                    {
                        e.printStackTrace();
                    }

                    JSONArray jsonLocationLatLong = new JSONArray();

                    try
                    {
                        if (null != address)
                        {
                            jsonLocationLatLong.put(address.getLatitude());
                            jsonLocationLatLong.put(address.getLongitude());

                            synchronized (syncLock)
                            {
                                jsonLocations.put(jsonLocationLatLong);
                            }
                        }
                    } catch (JSONException e)
                    {
                        e.printStackTrace();
                    }
                }
            }
            return null;
        }

        protected void onPostExecute(Void result)
        {
            if (null != address)
            {
                mMap.addMarker(new MarkerOptions()
                        .title(address.getPostalCode())
                        .position(new LatLng(address.getLatitude(), address.getLongitude())));
                locationEntry.getText().clear();
            }
        }
    }

    private class AlgorithmExecutor extends AsyncTask<Void, Void, Void>
    {
        String response;

        @Override
        protected Void doInBackground(Void... voids)
        {
            // Perform action on click

            HttpURLConnection connection = null;
            try
            {

                URL url = new URL("http://halfway.duckdns.org:9000/api/v1/lookup");
                connection = (HttpURLConnection) url.openConnection();
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-type", "application/json");

                OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream());
                out.write(jsonLocations.toString());
                out.close();

                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                String decodedString;
                StringBuilder sb = new StringBuilder();
                while ((decodedString = in.readLine()) != null) {
                    sb.append(decodedString);
                }
                response = sb.toString();

                in.close();


            } catch (IOException e)
            {
                e.printStackTrace();
            }
            finally
            {
                assert connection != null;
                connection.disconnect();

            }

            return null;
        }

        protected void onPostExecute(Void nothing)
        {
            JSONArray results;
            try
            {
                if (null != response)
                {
                    results = new JSONArray(response);
                    for (int i = 0; i < results.length() || i < 1; ++i)
                    {
                        JSONArray result = results.getJSONArray(i);
                        LatLng locationLatLng = new LatLng(result.getDouble(1), result.getDouble(2));

//                        if (null != resultLocation)
//                        {
//                            resultLocation.remove();
//                        }

                        resultLocation = mMap.addMarker(new MarkerOptions()
                                .title(result.getString(0))
                                .position(locationLatLng)
                                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)));
                    }
                }
            } catch (JSONException e)
            {
                e.printStackTrace();
            }
        }
    }
}

