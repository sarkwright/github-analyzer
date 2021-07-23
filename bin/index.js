#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios').default;
const util = require('util')

const pullRequestEvent = 'PullRequestEvent'
const program = new Command();
program.version('0.0.1');
let url
let capturedEvents = []

program
    .requiredOption('-o --organization <org>', 'the name of the org to analyze', formatUrl)
program.parse(process.argv);
const options = program.opts();


analyze(url)

function formatUrl(optionValue, _) {
    url = `https://api.github.com/orgs/${optionValue}/events`
    return optionValue
}

function parseEvents(response) {
    console.log('Got a response!!')
    console.log(response)
    for (const ev of response.data) {
        if (ev.type === pullRequestEvent) {
            capturedEvents.push(ev)
        }
    }
    if (response.headers['link']){
        let links = response.headers['link'].split(', ')
        let nextUrl
        for (const link of links){
            console.log(`parsing link ${link}`)
            if(link.indexOf('rel="next"') !== -1){
                nextUrl = link.split('>')[0].split('<')[1]
                break
            }
        }
        return nextUrl
    }
    return
}

function analyze(url) {
    console.log(`Got a url: ${url}!!!`)
    axios.get(url)
        .then(function(response){
            console.log('After request...')
            let next = parseEvents(response)
            console.log(`next: ${next}, !!next: ${!!next}`)
            if (!!next){
                analyze(next)
            } else {
                finalize()
            }
        })
        .catch(function (error) {
            console.log(`Unable to complete request: ${error}`);
        })
}

function finalize(){
    console.log(`Analysis complete, found ${capturedEvents.length} pull requests`)
    for (const ev of capturedEvents) {
        console.log(ev)
    }
}
