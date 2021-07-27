# github-analyzer
A CLI tool to analyze github pull requests

## Installation
There are 3 methods for running! 
### Source
```
node . -o ramda -t <GITHUB_TOKEN>
```

### NPM install
You can also install the project for global usage
```
npm install -g
```
Then you can all it anywhere using `ghanalyzer`

### Docker
You can build a containter for the app. The easiest way is to use the `run` make target
```
make run
```
This will build and drop you in the container. You can then use the `ghanalyzer`

## Usage:
```
ghanalyzer --help
Usage: ghanalyzer [options]

Options:
  -V, --version            output the version number
  -o --organization <org>  the name of the org to analyze
  -t --token <token>       the acces token for the GitHub API
  -v --verbose             increase verbosity (default: 0)
  -h, --help               display help for command
```
