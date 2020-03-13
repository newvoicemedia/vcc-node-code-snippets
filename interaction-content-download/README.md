# Download interaction content

This sample application is using ICS API to find interactions within a date range
and downloads all content to a folder.

## Setup
You will need a Vonage account with client credentials generated for the `interaction-content:read` scope.
Create a `.env` file in the project root with the following entries:
 - `CLIENT_ID`: this is the Client ID from your credentials 
 - `CLIENT_SECRET`: this is the Client Secret from your credentials
 - `REGION`: The region where your account was created. Possible values are 
 EMEA - Europe, the Middle East and Africa, NAM - North America and APAC - Asia-Pacific.
 
 Example `.env` file:
 ```
CLIENT_ID=3618db72-4836-45b6-9209-14b22b62a733
CLIENT_SECRET=XBBu7UCs4Um4uVf3
REGION=EMEA
```

By default, the application downloads files into the `download` folder located inside the project root. 
You can specify your own path in the `.env` file by adding:
```
DOWNLOAD_FOLDER=PATH_TO_YOUR_DOWNLOAD_LOCATION
``` 
If provided path relative, it will be created within project root folder.
You can provide an absolute path as well. Application will try to create the folder before
storing any content in it.
## Installation

To run the application, you will need `npm` in version `6` or higher and `node` in version `10` or higher.

Execute 
```
npm install
```
to install all required dependencies.

## Running the example

To run the example execute
```
npm start
```
This will execute the code in the `app.js` file.

If you open this file, you should be able to find two variables: `start` and `end`. 
They are dates in the `ISO8601` format. Those dates set a range in which the application searches for interactions. 
Dates are **inclusive**.

The `app.js` is creating an `IcsClient` class. You can find its definition in the `client.js` file.

The `search` method accepts these two dates and searches for interactions within this range.
It returns a JSON file with two attributes. `items`is a list of interaction objects. 
It's used by the `downloadPage` to get all content.

You can also use the `downloadContent` method to save a binary file. 
You will need to know the interaction GUID and the content key.

All downloaded content files will have names like:
`INTERACTION-GUID_CONTENT-KEY.[wav|json|webm]` for example:
`a8eb14fe-939a-43ff-91ab-acca25cb3d0a_callRecording.wav`.
