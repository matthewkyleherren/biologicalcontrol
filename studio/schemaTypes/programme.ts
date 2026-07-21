import {BookIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const programme = defineType({
  name: 'programme',
  title: 'Programme',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      initialValue: 'The Biological Control Programme',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lede',
      type: 'text',
      rows: 4,
      description: 'Opening paragraph on the Programme page',
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', type: 'string'}),
            defineField({name: 'caption', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'timeline',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'milestone',
          fields: [
            defineField({name: 'year', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'detail', type: 'text', rows: 3}),
          ],
          preview: {
            select: {title: 'title', subtitle: 'year'},
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Programme background'}
    },
  },
})
