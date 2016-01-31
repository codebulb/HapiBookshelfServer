'use strict';

const Hapi = require('hapi');
const hapiCrud = require('./serverStartup/hapiCrud.js');
const dbProperties = require('./serverStartup/dbProperties.js');
const dbInit = require('./serverStartup/dbInit.js');

// Setup Bookshelf / Knex
const knex = require('knex')(dbProperties);
const bookshelf = require('bookshelf')(knex);
bookshelf.plugin('virtuals')

// Setup Hapi
const server = new Hapi.Server();
server.connection({ routes: {cors: true }, port: 3000 });


// Models ====================

const models = require('./serverStartup/models.js')(bookshelf);
const Customer = models.Customer;
const Payment = models.Payment;


// REST service endpoints ====================

hapiCrud(server, {
basePath: '/customers',
	bookshelfModel: Customer,
	beforeAdd: function(request) {
		delete request.payload.payments;
	},
	beforeUpdate: function(request) {
		delete request.payload.payments;
	}
});

hapiCrud(server, {
basePath: '/customers/{customerId}/payments',
	baseQuery: function(request) {
		return {customer_id: request.params.customerId}
	},
	bookshelfModel: Payment,
	beforeAdd: function(request) {
		request.payload.customerId = request.params.customerId
	},
});


// Startup server ====================

server.start(() => dbInit(knex, function() {
	console.log('Server running at:', server.info.uri);
}));