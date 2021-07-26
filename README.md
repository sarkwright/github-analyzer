# github-analyzer
A CLI tool to analyze github pull requests

# Usage
There are 2 methods for running you can run the source with node like so:
```
node . -o ramda -t <GITHUB_TOKEN>
```
You can also install the project for global usage
```
npm install -g
```
Then you can all it anywhere using `ghanalyzer`

Usage:
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
