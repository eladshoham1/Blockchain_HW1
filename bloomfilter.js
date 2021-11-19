const { PartitionedBloomFilter } = require('bloom-filters')

// create a PartitionedBloomFilter of size 10, with 5 hash functions and a load factor of 0.5
const filter = new PartitionedBloomFilter(10, 5, 0.5)

// add some value in the filter
filter.add('alice')
filter.add('bob')

// lookup for some data
console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel')) // output: false