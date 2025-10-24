FROM python:3.13-bookworm

WORKDIR /SVS-SERVER
COPY . /SVS-SERVER/

# Install build dependencies: python 3.13, make
RUN apt-get update && apt-get upgrade -y

RUN make install

EXPOSE 80

CMD [ "make","run-dev" ]