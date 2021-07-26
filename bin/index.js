#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios').default;
const util = require('util')

// APIOrganization is used for low level interaction with the github API
class APIOrganization {
    constructor (baseUrl, accessToken) {
        // the base API url
        this.baseUrl = baseUrl
        // create the client to use for the requests
        this.githubClient = axios.create({
            baseURL: this.baseUrl

        })
        // set the headers for the requests
        this.githubClient.defaults.headers.common['Authorization'] = `token ${accessToken}`
        this.githubClient.defaults.headers.common['Accept'] = 'application/vnd.github.v3+json'
    }

    // getter for the base url
    get orgUrl(){
        return this.baseUrl
    }

    // getter for the repo url
    get repoApiUrl(){
        return `${this.baseUrl}/repos`
    }

    // getter for the pulls url for a repo
    getPullRequestUrl(repo){
        return `${this.baseUrl}/${repo}/pulls`
    }

    // getRepos gets the provided page of repos for the organization
    getRepos(page){
        return this.githubClient.get(`${this.repoApiUrl}?page=${page}`)
            .then(function(response){
                // parse the response of the request
                // array of urls from the response
                let repoUrls = []
                // the last page number returned in the response's link header
                const lastPage = getLastPage(response.headers)
                if (options.verbose > 1) console.log(`parsing repository response for page ${page}`)
                for (const repo of response.data) {
                    // get the url from each repo object
                    repoUrls.push(repo.url)
                }
                // return an object containing the urls and the last page from the response
                return {
                    repoUrls: repoUrls,
                    lastPage: lastPage
                }
            })
            .catch(function(error){
                // In the event of an error, log it and exit
                console.log(`Unable to fetch the Organization repositories due to an error:\n${error}`)
                process.exit(1)
            })
    }

    // getPulls gets the pull requets for provided repo and page for the organization
    getPulls(repoUrl, page){
        return this.githubClient.get(`${repoUrl}/pulls?page=${page}`)
            .then(function(response){
                // parse the repository response
                // the last page number returned in the response's link header
                const lastPage = getLastPage(response.headers)
                if (options.verbose > 1) console.log(`parsing pull response for repo ${repoUrl.split('/')[repoUrl.split('/').length - 1]}, page ${page}`)
                // return an object containing the pulls and the last page from the response
                return {
                    pulls: response.data,
                    lastPage: lastPage
                }
            })
            .catch(function(error){
                // In the event of an error log it
                console.log(`Unable to fetch the pulls for ${repoUrl}, page ${page} due to an error:\n${error}`)
            })
    }
}

// increaseVerbosity accepts the verbosity flag from the options and increases
// the verbosity
function increaseVerbosity(_, previousValue){
    return previousValue + 1
}

// getLastPage parses the headers and returns the last page or 1 if a link is
// not found
function getLastPage(headers){
    if (headers['link']) {
        // split the link headers
        let links = headers['link'].split(', ')
        for (const link of links){
            // check each link
            if (options.verbose > 1) console.log(`parsing link ${link}`)
            if(link.indexOf('rel="last"') !== -1){
                // if this is the last link, parse it
                const pageNum = parseInt(link.split('=')[1].split('>')[0])
                if (pageNum) {
                    return pageNum
                } else {
                    console.log(`Failed parseing last link`)
                }
            }
        }
    }
    return 1
}

// analyze is the main function for the analysis for the provided
// apiOrg
function analyze(apiOrg) {
    console.log(`Analyzing repo ${apiOrg.orgUrl}`)

    // get all the repos for the organization
    getRepos(apiOrg)
        .then(function(repoUrlResults) {
            if (options.verbose > 0) console.log(`Got repo urls:\n${util.inspect(repoUrlResults)}`)
            return repoUrlResults
        })
        .then(function(repoUrls){
            // get the pulls for each repo in a different async promise
            let pullPromises = []
            for (const repoUrl of repoUrls){
                pullPromises.push(getPulls(apiOrg, repoUrl))
            }
            return Promise.all(pullPromises)
        })
        .then(function(pullResults){
            // combine all the pull requests into a single array
            let allPulls = []
            for (const pullResult of pullResults){
                allPulls.push.apply(allPulls, pullResult.pullRequests)
            }
            // log the result
            console.log(`Found ${allPulls.length} total pull requests.`)
        })
}

// getRepos gets all pagenated repositories from the API
function getRepos(apiOrg, page, urls) {
    // return a promise for the results
    return new Promise(function(resolve) {
        // can be called recursively, so default if not provided
        if (!page) page = 1
        if (!urls) urls = []
        // get the repos for the current page
        apiOrg.getRepos(page)
            .then(function(repoResults){
                page += 1
                // combine the urls from the response to the current urls
                urls.push.apply(urls, repoResults.repoUrls)
                if (page < repoResults.lastPage) {
                    // if there is another page, recursively resolve
                    resolve(getRepos(apiOrg, page, urls))
                } else {
                    // resolve with the collected urls
                    resolve(urls)
                }
            })
    })
}

// getPulls gets all pagenated pull requests for the provided repo from the API
function getPulls(apiOrg, repoUrl, page, pulls) {
    // return a promise for the results
    return new Promise(function(resolve) {
        // can be called recursively, so default if not provided
        if (!page) page = 1
        if (!pulls) pulls = []
        // get the pulls for the current page
        apiOrg.getPulls(repoUrl, page)
            .then(function(pullResults){
                page += 1
                // combine the pull requests from the response to the current urls
                pulls.push.apply(pulls, pullResults.pulls)
                if (page < pullResults.lastPage) {
                    // if there is another page, recursively resolve
                    resolve(getPulls(apiOrg, repoUrl, page, pulls))
                } else {
                    // resolve with the collected pulls
                    resolve({
                        repo: repoUrl,
                        pullRequests: pulls
                    })
                }
            })
    })
}

// create a commander instance
const program = new Command();
program.version('1.0.0');

let apiOrg

// define the options for the CLI
program
    .requiredOption('-o --organization <org>', 'the name of the org to analyze')
    .requiredOption('-t --token <token>', 'the acces token for the GitHub API')
    .option('-v --verbose', 'increase verbosity', increaseVerbosity, 0)
// Parse the arguments
program.parse(process.argv)
// Get the parsed values
const options = program.opts()
// Create the APIOrganization for the options
apiOrg = new APIOrganization(`https://api.github.com/orgs/${options.organization}`, options.token)

// kick off the analysis
analyze(apiOrg)
