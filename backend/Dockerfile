FROM golang:1.23-alpine AS build

WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /calculator-api ./cmd/api

FROM alpine:3.21
RUN adduser -D -u 10001 calculator
USER calculator
COPY --from=build /calculator-api /calculator-api

EXPOSE 8080
CMD ["/calculator-api"]

