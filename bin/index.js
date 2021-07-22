#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios').default;

const program = new Command();
program.version('0.0.1');
let url

program
    .requiredOption('-o --organization <org>', 'the name of the org to analyze', formatUrl)
program.parse(process.argv);
const options = program.opts();


analyze(url)

function formatUrl(optionValue, _) {
    url = `https://api.github.com/orgs/${optionValue}`
    return optionValue
}

function analyze(url) {
    console.log(`Got a url: ${url}!!!`)
    axios.get(url)
        .then(function (resp){
            console.log('Got a response!!')
            console.log(resp)
        })
        .catch(function (error) {
            console.log(`Unable to complete request: ${error}`);
          })
}
