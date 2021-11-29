const { PartitionedBloomFilter } = require('bloom-filters')

// create a PartitionedBloomFilter of size 10, with 5 hash functions and a load factor of 0.5
/*let filter = new PartitionedBloomFilter(10, 5, 0.5)

// add some value in the filter
/*filter.add(['alice', 'bob'])
//filter.add('bob')

// lookup for some data
console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel')) // output: false*/

// now use it like a classic bloom filter!
// ...

// alternatively, create a PartitionedBloomFilter optimal for a number of items and a desired error rate
const items = ['alice', 'bob']
const errorRate = 0.04 // 4 % error rate
/*let filter = PartitionedBloomFilter.create(items.length, errorRate)*/

// or create a PartitionedBloomFilter optimal for a collections of items and a desired error rate
let filter = PartitionedBloomFilter.from(items, errorRate)

console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel')) // output: false*/