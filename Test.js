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
