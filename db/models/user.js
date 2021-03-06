'use strict';
const bcrypt = require('bcryptjs');
const { Model, Op } = require('sequelize');

class User extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            date_activation_sent: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            is_password_reset: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        };

        return super.init(schema, {
            modelName: 'user',
            sequelize,
        });
    }

    static encryptPassword(password) {
        const rounds = 12;
        return bcrypt.hash(password, rounds);
    }

    static checkValidPassword(storedHash, typedPass) {
        return bcrypt.compare(typedPass, storedHash);
    }

    static findByUsername(username) {
        return this.findOne({
            where: { username: { [Op.eq]: username } },
        });
    }

    static findByUsernameFuzzy(search) {
        return this.findAll({
            where: { username: { [Op.substring]: search } },
        });
    }

    static createUser({ username, password, isActive = false }) {
        return this.encryptPassword(password).then((encryptedPassword) => {
            return this.create({
                username: username,
                password: encryptedPassword,
                is_active: isActive,
            });
        });
    }

    static updateNewPassword({ id, newPassword }) {
        return this.encryptPassword(newPassword).then(
            (newEncryptedPassword) => {
                return this.findByPk(id).then((user) => {
                    return user.update({
                        password: newEncryptedPassword,
                        is_password_reset: false,
                    });
                });
            }
        );
    }

    static updateNewEmail({ id, newEmail }) {
        return this.update(
            { username: newEmail, is_active: false },
            { where: { id: { [Op.eq]: id } } }
        );
    }

    static updateDateOfActivationAttempt({ id, dateOfActivationAttempt }) {
        return this.update(
            { date_activation_sent: dateOfActivationAttempt },
            { where: { id: { [Op.eq]: id } } }
        );
    }

    static findWithActivePasswordReset(id) {
        return this.findOne({
            where: {
                id: { [Op.eq]: id },
                is_password_reset: true,
            },
        });
    }

    static updateIsInPasswordReset(id) {
        return this.update(
            { is_password_reset: true },
            { where: { id: { [Op.eq]: id } } }
        );
    }

    static activateUser(id) {
        return this.update(
            { is_active: true, date_activation_sent: null },
            { where: { id: { [Op.eq]: id } } }
        );
    }
}

module.exports = User;
