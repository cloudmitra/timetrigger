const axios = require('axios'); // For making API requests
const appInsights = require('applicationinsights'); // For sending data to Application Insights

// Initialize the Application Insights client
appInsights.setup("<your_instrumentation_key>").start(); // Replace with your Application Insights Instrumentation Key
const client = appInsights.defaultClient;

module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();

    if (myTimer.isPastDue) {
        context.log('Timer function is running late!');
    }

    context.log('Timer trigger function executed at', timeStamp);

    try {
        // Ping the API endpoint
        const apiEndpoint = "<your_api_endpoint>"; // Replace with the API endpoint URL
        const startTime = Date.now(); // Start time for measuring API response duration
        const response = await axios.get(apiEndpoint); // HTTP GET request
        const duration = Date.now() - startTime; // Measure response duration

        context.log('API response status:', response.status);
        
        // Create availability telemetry data
        const availabilityData = {
            id: timeStamp, // Unique ID for the test
            name: "API Availability Test", // Test name
            duration: duration, // Response time in milliseconds
            success: response.status === 200, // Success if HTTP status is 200
            runLocation: "Azure Function", // Location of the test
            message: response.statusText // Additional information
        };

        // Send availability data to Application Insights
        client.trackAvailability(availabilityData);
        context.log('Availability data sent to Application Insights:', availabilityData);
    } catch (error) {
        context.log('Error occurred:', error.message);

        // Send availability data with failure to Application Insights
        const availabilityData = {
            id: timeStamp,
            name: "API Availability Test",
            duration: 0,
            success: false,
            runLocation: "Azure Function",
            message: error.message
        };

        client.trackAvailability(availabilityData);
        context.log('Error availability data sent to Application Insights:', availabilityData);
    }
};
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const appInsights = require('applicationinsights');

// Initialize Application Insights
appInsights.setup("<your_instrumentation_key>").start(); // Replace with your instrumentation key
const client = appInsights.defaultClient;

// Function to fetch endpoints for a specific environment
function getEndpoints(env) {
    try {
        const filePath = path.resolve(__dirname, 'environments.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        const endpoints = jsonData.environments[env];
        if (!endpoints) {
            throw new Error(`Environment '${env}' not found.`);
        }
        return endpoints;
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        throw error;
    }
}

module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();

    if (myTimer.isPastDue) {
        context.log('Timer function is running late!');
    }

    context.log('Timer trigger function executed at', timeStamp);

    // Specify the environment you want to monitor
    const environment = "dev"; // Change this to "int", "uat", or "prod" as needed

    try {
        const endpoints = getEndpoints(environment);
        
        for (const endpoint of endpoints) {
            try {
                // Ping the API endpoint
                const startTime = Date.now();
                const response = await axios.get(endpoint.url);
                const duration = Date.now() - startTime;

                context.log(`API response for ${endpoint.name} (${endpoint.url}):`, response.status);

                // Create availability telemetry data
                const availabilityData = {
                    id: timeStamp,
                    name: `API Availability Test - ${endpoint.name}`,
                    duration: duration,
                    success: response.status === 200,
                    runLocation: "Azure Function",
                    message: response.statusText
                };

                // Send availability data to Application Insights
                client.trackAvailability(availabilityData);
                context.log('Availability data sent to Application Insights:', availabilityData);
            } catch (error) {
                context.log(`Error pinging ${endpoint.name} (${endpoint.url}):`, error.message);

                // Send failure data to Application Insights
                const availabilityData = {
                    id: timeStamp,
                    name: `API Availability Test - ${endpoint.name}`,
                    duration: 0,
                    success: false,
                    runLocation: "Azure Function",
                    message: error.message
                };

                client.trackAvailability(availabilityData);
                context.log('Error availability data sent to Application Insights:', availabilityData);
            }
        }
    } catch (error) {
        context.log('Error occurred while fetching endpoints or sending data:', error.message);
    }
};
{
    "environments": {
        "dev": [
            {
                "name": "API Endpoint 1",
                "url": "https://dev.api.endpoint1.com"
            },
            {
                "name": "API Endpoint 2",
                "url": "https://dev.api.endpoint2.com"
            }
        ],
        "int": [
            {
                "name": "API Endpoint 1",
                "url": "https://int.api.endpoint1.com"
            },
            {
                "name": "API Endpoint 2",
                "url": "https://int.api.endpoint2.com"
            }
        ],
        "uat": [
            {
                "name": "API Endpoint 1",
                "url": "https://uat.api.endpoint1.com"
            },
            {
                "name": "API Endpoint 2",
                "url": "https://uat.api.endpoint2.com"
            }
        ],
        "prod": [
            {
                "name": "API Endpoint 1",
                "url": "https://prod.api.endpoint1.com"
            },
            {
                "name": "API Endpoint 2",
                "url": "https://prod.api.endpoint2.com"
            }
        ]
    }
}
