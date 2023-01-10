import { UserPrivilege } from '@modules/auth/user.enums'
import Joi from 'joi'
import { entries } from 'lodash'

const userBaseKeys = {
  login: Joi.string().min(3).max(255).required(),
  name: Joi.string().min(5).max(244).required(),
  email: Joi.string().email(),
  privilege: Joi.string()
    .valid(UserPrivilege.ADMIN, UserPrivilege.USER)
    .required(),
}

const userDataKeys = {
  id: Joi.number().min(1).required(),
  deleted: Joi.boolean().required(),
  createdAt: Joi.string().isoDate(),
  updatedAt: Joi.string().isoDate(),
  deletedAt: Joi.string().isoDate(),
}

export const userSchema = Joi.object().keys({
  ...userBaseKeys,
  password: Joi.string().min(8).max(255).required(),
})

export const patchSchema = Joi.object().keys({
  ...entries(userBaseKeys).reduce<{ [key: string]: Joi.StringSchema }>(
    (acc, entry) => {
      const [key, value] = entry
      acc[key] = value.optional()

      return acc
    },
    {}
  ),
  password: Joi.string().min(8).max(255),
})

export const userDataSchema = Joi.object().keys({
  ...userBaseKeys,
  ...userDataKeys,
})
