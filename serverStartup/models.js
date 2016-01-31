'use strict';

const Checkit = require('checkit');
const moment = require('moment');
const tableColumnRenamer = require('./tableColumnRenamer.js');

module.exports = function (bookshelf) {
    const BaseModel = require('bookshelf-base-model')(bookshelf, {timestamps: false})

    return {
        Customer: BaseModel.extend({
            tableName: 'customer',
            parse: tableColumnRenamer.renameOnParse,
            format: tableColumnRenamer.renameOnFormat,
            payments: {
                get: function () {
                    // return nothing
                    return null;
                },
                set: function (value) {
                    // do nothing
                }
            },
            fields: {
                name: {validate: ['required', 'pattern:[A-Za-z ]*']},
                employmentStatus: {validate: ['required']},
            },
            saving: function saving(model, attrs, options) {
				// override faulty 'bookshelf-base-model' default behavior
            },
        }),
        Payment: BaseModel.extend({
            tableName: 'payment',
            customer: function () {
                return this.belongsTo(Customer);
            },
            parse: tableColumnRenamer.renameOnParse,
            format: function (attrs) {
                attrs = tableColumnRenamer.renameOnFormat(attrs);
                if (attrs.date != null) {
                    // write to MySQL date, as in http://stackoverflow.com/a/27381633/1399395
                    attrs.date = moment(attrs.date).format('YYYY-MM-DD HH:mm:ss');
                }
                return attrs;
            },
            // read from MySQL date, as in https://github.com/tgriesser/bookshelf/issues/246#issuecomment-35498066
            toJSON: function () {
                var attrs = bookshelf.Model.prototype.toJSON.apply(this, arguments);
                if (attrs.date != null) {
                    attrs.date = moment(this.get('date')).format('YYYY-MM-DD');
                }
                return attrs;
            },
            fields: {amount: {validate: ['required', 'naturalNonZero']}},
            saving: function saving(model, attrs, options) {
				// override faulty 'bookshelf-base-model' default behavior
            },
        })
    }
}

Checkit.Validator.prototype.pattern = function (val, pattern) {
    return new RegExp('^' + pattern + '$').test(val)
}
