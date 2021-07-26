const { Command } = require('commander')
const path = require('path')
const exec = require('child_process').exec

// ghanalyzer calls the cli with the provided options
function ghanalyzer(options) {
    return new Promise(function(resolve){
        // call the cli with the procided options
        exec(
            `node ${path.resolve('./bin/index')} ${options.join(' ')}`,
            function (error, stdout, stderr){
                resolve({
                    code: error && error.code ? error.code : 0,
                    error: error,
                    stdout: stdout,
                    stderr: stderr
                })
            })
    })
}

test('Call CLI with the help flag', async () => {
    const runResult = await  ghanalyzer(['--help'])
    expect(runResult.code).toBe(0)
})

test('Call CLI without the org flag', async () => {
    const runResult = await  ghanalyzer(['-t foo'])
    expect(runResult.code).toBe(1)
    expect(runResult.stderr).toBe(`error: required option '-o --organization <org>' not specified\n`)
})

test('Call CLI without the token flag', async () => {
    const runResult = await  ghanalyzer(['-o foo'])
    expect(runResult.code).toBe(1)
    expect(runResult.stderr).toBe(`error: required option '-t --token <token>' not specified\n`)
})
