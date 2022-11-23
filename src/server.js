import { createServer } from "http";
import { Readable, Transform } from "node:stream";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";

const PORT = process.env.NODE_STREAMS_PORT || 3000;

function* toListEmployees() {
  for (let index = 0; index < 10; index++) {
    yield {
      id: randomUUID(),
      name: faker.name.fullName(),
      email: faker.internet.email(),
      title: faker.name.jobTitle(),
      wage: faker.finance.amount(20000, 250000),
    };
  }
}

// The base of a stream is a readable that emit data
const employeeGenerator = new Readable({
  read() {
    for (const employee of toListEmployees()) {
      // we can use the push methos with a string as parameter to push data into the stream
      this.push(JSON.stringify(employee));
    }
    // if we pass null then the stream have just finished
    this.push(null);
  },
});

// transform as intermediate streams that can modify the content or just see what is happening in the stream
const logHighestAndLowestrWage = new Transform({
  transform(chunk, enc, cb) {
    const employee = JSON.parse(chunk);
    const wage = Number(employee.wage);
    if (wage > this.highestWage) {
      this.highestWage = wage;
    }
    if (wage < this.highestWage) {
      this.lowestWage = wage;
    }
    cb(null, chunk);
  },
  final(cb) {
    console.log(`Highest salary: $${this.highestWage.toFixed(2)}`);
    console.log(`Lowest salary: $${this.lowestWage.toFixed(2)}`);
    cb();
  },
});
logHighestAndLowestrWage.highestWage = Number.MIN_VALUE;
logHighestAndLowestrWage.lowestWage = Number.MIN_VALUE;

const raiseTheSalary = new Transform({
  transform(chunk, enc, cb) {
    const employee = JSON.parse(chunk);
    const currentWage = Number(employee.wage);
    employee.newWage = (currentWage * (1 + Math.random())).toFixed(2);
    cb(null, JSON.stringify(employee).concat("\n"));
  },
});

function requestHandler(request, response) {
  employeeGenerator
    .pipe(logHighestAndLowestrWage)
    .pipe(raiseTheSalary)
    .pipe(response);
}

createServer(requestHandler)
  .listen(PORT)
  .on("listening", () => console.log(`Server running at ${PORT}`));
