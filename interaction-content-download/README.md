# Download interaction content

This sample application uses the Interaction Content API to find interactions within a date range and download all content to a local folder.

## Setup
You will need a Vonage Contact Centre account with client credentials generated for the `interaction-content:read` scope.
Copy a `example.env` file to `.env`. Then edit the `.env` file to set up following entries:
 - `CLIENT_ID`: this is the Client ID from your credentials 
 - `CLIENT_SECRET`: this is the Client Secret from your credentials
 - `REGION`: The region where your account was created. Possible values are:
    - EMEA - Europe, the Middle East and Africa
    - NAM - North America
    - APAC - Asia-Pacific.
 - `DOWNLOAD_FOLDER`: by default, the application downloads files into the `download` folder located inside the project root. However, you can specify your own path. If provided path relative, it will be created within project root folder. You can provide an absolute path as well. Application will try to create the folder before storing any content in it.
 
 Example of the `.env` file:
```
CLIENT_ID=3618db72-4836-45b6-9209-14b22b62a733
CLIENT_SECRET=XBBu7UCs4Um4uVf3
REGION=EMEA
DOWNLOAD_FOLDER=/downloads/contents
``` 

## Installation

To run the application, you will need [`npm`](https://www.npmjs.com/get-npm) in version `6` or higher and [`node`](https://nodejs.org/en/download/) in version `10` or higher.

Execute 
```
npm install
```
to install all required dependencies.

## Running the example

To run the example execute
```
node app.js
```
This will execute the code in the `app.js` file. If you have POSIX system you can just execute `app.js` file. 
If you run this script without any parameters it will download all content found yesterday.
If you want to set your own date range you can use options `--start` (or `s`) and `--end` (or `e`) and pass dates in `ISO8601` format for example:
```
node app.js --start 2020-05-01T00:00:00Z --end 2020-05-31T23:59:59Z
```
will look for interactions that were created in May 2020 and download all content. 
The provided dates are **inclusive**.

###The `app.js` file

The `app.js` is creating an `IcsClient` class. You can find its definition in the `client.js` file.

The `search` method accepts two dates and searches for interactions within time range.
It returns a JSON file with two attributes. `items` is a list of interaction objects. 
It's used by the `downloadPage` to get all content.

You can also use the `downloadContent` method to save a binary file. 
You will need to know the interaction GUID and the content key.

All downloaded content files will have names like:
`INTERACTION-GUID_CONTENT-KEY.[wav|json|webm]` for example:
`a8eb14fe-939a-43ff-91ab-acca25cb3d0a_callRecording.wav`.

You can find all methods used in `app.js` in `client.js` file, with detailed explanations of each method, it's input parameters and expected output.
