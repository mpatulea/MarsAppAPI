import express from "express";
const fs = require("fs");
import {expect} from "chai";

const app = express();
app.use(express.json());

describe('Rovers Output Test', function() {
    let rovers_output = fs.readFileSync('./roversResponse.json');
    let parsed_data = JSON.parse(rovers_output);
    let rovers_file = parsed_data['rovers'];

    it('should find 4 individual rovers', function() {
        expect(rovers_file.length).to.equal(4);
    });
})