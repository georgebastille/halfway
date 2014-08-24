package com.elixr.halfwayhouse;


import android.app.Activity;
import android.location.Address;
import android.location.Criteria;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.StrictMode;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MapActivity extends Activity {

    GoogleMap mMap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        setContentView(R.layout.activity_map);

        setUpMapIfNeeded();

        final Button button = (Button) findViewById(R.id.button);
        button.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                HttpClient client = new DefaultHttpClient();
                HttpPost post = new HttpPost("http://192.168.1.67:9000/api/v1/lookup");

                JSONArray stations = new JSONArray();
                stations.put("CFS");
                stations.put("RMD");
                stations.put("UXB");

                try {
                    post.setEntity(new StringEntity(stations.toString()));

                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                }

                //sets a request header so the page receving the request
                //will know what to do with it
                post.setHeader("Accept", "application/json");
                post.setHeader("Content-type", "application/json");


                //Handles what is returned from the page
                ResponseHandler responseHandler = new BasicResponseHandler();
                try {
                    client.execute(post, responseHandler);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                Geocoder geocoder = new Geocoder(getBaseContext(), Locale.getDefault());
                List<Address> addresses = new ArrayList<Address>();

                try {
                    EditText address1EditText = (EditText) findViewById(R.id.address1EditText);
                    String address1 = address1EditText.getText().toString();
                    if (null != address1 && !address1.isEmpty()) {
                        addresses.addAll(geocoder.getFromLocationName(address1, 1));
                    }

                    EditText address2EditText = (EditText) findViewById(R.id.address2EditText);
                    String address2 = address2EditText.getText().toString();
                    if (null != address2 && !address2.isEmpty()) {
                        addresses.addAll(geocoder.getFromLocationName(address2, 1));
                    }

                    EditText address3EditText = (EditText) findViewById(R.id.address3EditText);
                    String address3 = address3EditText.getText().toString();
                    if (null != address3 && !address3.isEmpty()) {
                        addresses.addAll(geocoder.getFromLocationName(address3, 1));
                    }

                    EditText address4EditText = (EditText) findViewById(R.id.address4EditText);
                    String address4 = address4EditText.getText().toString();
                    if (null != address4 && !address4.isEmpty()) {
                        addresses.addAll(geocoder.getFromLocationName(address4, 1));
                    }

                } catch (IOException e) {
                    e.printStackTrace();
                }


                for (Address location : addresses) {
                    LatLng locationLatLng = new LatLng(location.getLatitude(), location.getLongitude());
                    mMap.addMarker(new MarkerOptions()
                            .title(location.getPostalCode())
                            .position(locationLatLng));
                }
                // Perform action on click
            }
        });

    }

    private void setUpMapIfNeeded() {
        // Do a null check to confirm that we have not already instantiated the map.
        if (mMap == null) {
            mMap = ((MapFragment) getFragmentManager().findFragmentById(R.id.map))
                    .getMap();
        }

        mMap.setMyLocationEnabled(true);

        LocationManager locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);

        // Create a criteria object to retrieve provider
        Criteria criteria = new Criteria();

        // Get the name of the best provider
        String provider = locationManager.getBestProvider(criteria, true);

        Location myLocation = locationManager.getLastKnownLocation(provider);

        LatLng myLatLng = new LatLng(myLocation.getLatitude(), myLocation.getLongitude());

        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(myLatLng, 13));
    }
}

