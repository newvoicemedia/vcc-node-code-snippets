const { verify } = require('jsonwebtoken')
const { createHash, timingSafeEqual } = require('crypto');
const express = require('express')

const app = express()
const port = 3000

// Secret included in code for demonstration purposes only.
// const secretBase64 = process.env.SECRET
const secretBase64 = 'YqABRE18Vk2zfiVVMV7uag=='
const secretBytes = Buffer.from(secretBase64, 'base64')

function validateSignature (req, res, next) {
    try {
        const token = req.get('Vonage-Signature').substring('Bearer '.length)
        console.log(`Token: ${token}`)
        const payload = req.rawBody
        console.log(`Payload: ${payload}`)

        // verify throws on failure
        const decodedToken = verify(token, secretBytes)
        console.log('Token verified!')
        console.log(decodedToken)

        const payloadHashBytes = createHash('sha256')
            .update(payload)
            .digest()
        const expectedHashBytes = Buffer.from(decodedToken['payload_hash'], 'hex')

        // timingSafeEqual throws if different lengths
        if (timingSafeEqual(payloadHashBytes, expectedHashBytes)) {
            console.log('Payload verified!')
            next()
        } else {
            console.error('Payload mismatch!')
            res.sendStatus(401)
        }
    }
    catch (error) {
        console.error(error)
        res.sendStatus(401)
    }
}

app.post(
    '/webhook-handler',
    express.json({
        type: ['application/cloudevents+json'],
        verify: (req, res, buf) => {
            req.rawBody = buf
    }}),
    validateSignature,
    handler
)

function handler(req, res) {
    // Treat body as JSON object and handle webhook event
    const payload = req.body
    console.log(`Received '${payload.type}' event.`)
    // ...
    res.sendStatus(200)
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})