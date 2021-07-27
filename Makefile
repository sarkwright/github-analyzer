IMAGE=ghanalyzer

.PHONY: clean
clean:
	docker image rm -f ghanalyzer-build

.PHONY: build
build: clean
	docker build -f ./container/Dockerfile . -t $(IMAGE)-build

.PHONY: run
run: build
	docker run -it --entrypoint bash $(IMAGE)-build
