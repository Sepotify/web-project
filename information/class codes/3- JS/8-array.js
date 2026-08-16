let numbers = [3, 7, 10];

let filtered_numbers = numbers.filter((item) => item % 2 == 0);

console.log(numbers);
console.log(filtered_numbers);

numbers.forEach((item) => console.log(item ** 2));

console.log(numbers.findIndex((item) => item == 7))

console.log(numbers.map(item => item ** 2));

sum = 0;
for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
}
console.log(sum);

const numbers2 = [1, 2, 3, 4];

console.log(numbers2.reduce((acc, s) => acc + s, 0)); // 10
