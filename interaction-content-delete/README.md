# Delete interaction content

This sample application uses the Interaction Content API to delete interactions with provided GUIDs.

## Setup
You will need a Vonage Contact Centre account with client credentials generated for the `interaction-content:delete` scope.
Copy a `example.env` file to `.env`. Then edit the `.env` file to set up following entries:
- `CLIENT_ID`: this is the Client ID from your credentials
- `CLIENT_SECRET`: this is the Client Secret from your credentials
- `REGION`: The region where your account was created. Possible values are:
    - EMEA - Europe, the Middle East and Africa
    - NAM - North America
    - APAC - Asia-Pacific.

Example of the `.env` file:
```
CLIENT_ID=3618db72-4836-45b6-9209-14b22b62a733
CLIENT_SECRET=XBBu7UCs4Um4uVf3
REGION=EMEA
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
node app.js -f [path-to-file-with-guids]
```
This will execute the code in the `app.js` file. If you have POSIX system you can just execute `app.js` file.
You have to specify path to text file with list of GUIDs to remove. For example:
```
node app.js -f ./guids.txt
```
will look for GUIDs to remove in `guids.txt` file in the directory where `app.js` script is saved. 
Each GUID should be placed in separate line.
Failures (if there are any) will be stored in `failures.csv` file. 
If you don't have permissions to delete given GUID, you'll see 403 error code in `failures.csv` file.
In case of server error, you may see 500 or similar status code. In such case you can try to delete these GUIDs again.

API has introduced a rate limiting set to around 16 requests per minute.
In the sample application there is a rate limit set and also retry added in case of HTTP errors:
429 and 5XX.

###The `app.js` file

The `app.js` uses `IcsClient` class. You can find its definition in the `client.js` file.

The `deleteInteractions` method accepts list of GUIDs and deletes interaction metadata and all the content related to these GUIDs.
It returns JSON object with `failures` property. It's a list of failed deletions.
Each failure is an object with three properties: `guid`, `statusCode` and `message`.
