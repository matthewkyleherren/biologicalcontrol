import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const themeTag = defineType({
  name: 'themeTag',
  title: 'Theme',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
    }),
  ],
})
