let person = {
    name: 'ali',
    age: 18,
    isStudent: true,
    sayHello: () => {
        return 'hello';
    },
    sayName: () => {
        return this.name;
    },
};

console.log(person.sayHello());

// const name = person.name;
// const age = person.age;
// const isStudent = person.isStudent;
const { name, age, isStudent } = person;

console.log(name)

let arr = [3, 4, 9];
const [first] = arr;
console.log(first);

console.log(person.sayName());

const f = person.sayName;
console.log(f());
