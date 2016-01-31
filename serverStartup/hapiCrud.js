'use strict';

const _ = require('lodash');

module.exports = function (server, config) {
    // find all
    server.route({
        method: 'GET',
        path: config.basePath,
        handler: function (request, reply) {
            findAllQuery(request, config).fetchAll().then(function (collection) {
                reply(collection);
            });
        }
    });

    // find by id
    server.route({
        method: 'GET',
        path: config.basePath + '/{id}',
        handler: function (request, reply) {
            config.bookshelfModel.where(findByIdQueryParams(request, config)).fetch().then(function (entity) {
                reply(entity);
            });
        }
    });

    // add
    server.route({
        method: ['PUT', 'POST'],
        path: config.basePath,
        handler: function (request, reply) {
            if (typeof config.beforeAdd !== 'undefined')
                config.beforeAdd(request);
            config.bookshelfModel.forge(request.payload).save().then(function (entity) {
                reply(entity);
            }).catch(config.bookshelfModel.ValidationError, function (err) {
                reply.response(transformConstraintViolationMessages(err)).code(400);
            });
        }
    });

    // update
    server.route({
        method: ['PUT', 'POST'],
        path: config.basePath + '/{id}',
        handler: function (request, reply) {
            if (typeof config.beforeUpdate !== 'undefined')
                config.beforeUpdate(request);
            config.bookshelfModel.forge(request.payload).save().then(function (entity) {
                reply(entity);
            }).catch(config.bookshelfModel.ValidationError, function (err) {
                reply.response(transformConstraintViolationMessages(err)).code(400);
            });
        }
    });

    // delete
    server.route({
        method: 'DELETE',
        path: config.basePath + '/{id}',
        handler: function (request, reply) {
            config.bookshelfModel.where(findByIdQueryParams(request, config)).destroy().then(function (entity) {
                reply().code(204);
            }).catch(function (err) {
                reply.response({error: {exception: err.code, detailMessage: err.message}}).code(400);
            });
        }
    });
}

function findAllQuery(request, config) {
    return typeof config.baseQuery === 'undefined' ? config.bookshelfModel : config.bookshelfModel.where(config.baseQuery(request));
}

function findByIdQueryParams(request, config) {
    return typeof config.baseQuery === 'undefined' ? {'id': request.params.id} : _.merge({'id': request.params.id}, config.baseQuery(request));
}

function transformConstraintViolationMessages(input) {
    return {
        validationErrors: _.mapValues(input.errors, function (v) {
            return {
                messageTemplate: v.errors[0].rule
            }
        })
    }
}