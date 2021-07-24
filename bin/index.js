#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios').default;
const util = require('util')

class APIOrganization {
    constructor (baseUrl, accessToken) {
        this.baseUrl = baseUrl
        axios.defaults.baseURL = baseUrl
        axios.defaults.headers.common['Authorization'] = `'token ${accessToken}'`
        axios.defaults.headers.common['Accept'] = 'application/vnd.github.v3+json'
        this.accessToken = accessToken
    }

    get orgUrl(){
        return this.baseUrl
    }

    get repoApiUrl(){
        return `${this.baseUrl}/repos`
    }

    getRepos(page){
        return axios.get(`${this.repoApiUrl}?page=${page}`)
            .then(function(response){
                let repoUrls = []
                const lastPage = getLastPage(response.headers)
                if (options.verbose > 1) console.log(`parsing repository response for page ${page}`)
                for (const repo of response.data) {
                    repoUrls.push(repo.url)
                }
                return {
                    repoUrls: repoUrls,
                    lastPage: lastPage
                }
            })
    }

    getPulls(repoUrl, page){
        return axios.get(`${repoUrl}/pulls?page=${page}`)
            .then(function(response){
                const lastPage = getLastPage(response.headers)
                if (options.verbose > 1) console.log(`parsing pull response for repo ${repoUrl.split('/')[repoUrl.split('/').length - 1]}, page ${page}`)
                return {
                    pulls: response.data,
                    lastPage: lastPage
                }
            })
    }

    getPullRequestUrl(repo){
        return `${this.baseUrl}/${repo}/pulls`
    }
}

function formatUrl(optionValue) {
    apiOrg = new APIOrganization(`https://api.github.com/orgs/${optionValue}`)
    return optionValue
}

function increaseVerbosity(_, previousValue){
    return previousValue + 1
}

function getLastPage(headers){
    if (headers['link']) {
        let links = headers['link'].split(', ')
        for (const link of links){
            if (options.verbose > 1) console.log(`parsing link ${link}`)
            if(link.indexOf('rel="last"') !== -1){
                return parseInt(link.split('=')[1].split('>')[0])
            }
        }
    }
    return 1
}

function analyze(apiOrg) {
    console.log(`Analyzing repo ${apiOrg.orgUrl}`)

    getRepos(apiOrg)
        .then(function(repoUrlResults) {
            if (options.verbose > 0) console.log(`Got repo urls:\n${util.inspect(repoUrlResults)}`)
            return repoUrlResults
        })
        .then(function(repoUrls){
            let pullPromises = []
            for (const repoUrl of repoUrls){
                pullPromises.push(getPulls(apiOrg, repoUrl))
            }
            return Promise.all(pullPromises)
        })
        .then(function(pullResults){
            let allPulls = []
            for (const pullResult of pullResults){
                allPulls.push.apply(allPulls, pullResult.pullRequests)
            }
            console.log(`Found ${allPulls.length} total pull requests.`)
        })
}

function getRepos(apiOrg, page, urls) {
    return new Promise(function(resolve) {
        if (!page) page = 1
        if (!urls) urls = []
        apiOrg.getRepos(page)
            .then(function(repoResults){
                page += 1
                urls.push.apply(urls, repoResults.repoUrls)
                if (page < repoResults.lastPage) {
                    resolve(getRepos(apiOrg, page, urls))
                } else {
                    resolve(urls)
                }
            })
    })
}

function getPulls(apiOrg, repoUrl, page, pulls) {
    return new Promise(function(resolve) {
        if (!page) page = 1
        if (!pulls) pulls = []
        apiOrg.getPulls(repoUrl, page)
            .then(function(pullResults){
                page += 1
                pulls.push.apply(pulls, pullResults.pulls)
                if (page < pullResults.lastPage) {
                    resolve(getPulls(apiOrg, repoUrl, page, pulls))
                } else {
                    resolve({
                        repo: repoUrl,
                        pullRequests: pulls
                    })
                }
            })
    })
}

const program = new Command();
program.version('0.1.0');

let apiOrg

program
    .requiredOption('-o --organization <org>', 'the name of the org to analyze', formatUrl)
    .requiredOption('-t --token <token>', 'the acces token for the GitHub API')
    .option('-v --verbose', 'increase verbosity', increaseVerbosity, 0)
program.parse(process.argv);
const options = program.opts();

analyze(apiOrg, options.token)
