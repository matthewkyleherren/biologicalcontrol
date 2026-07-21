import {ImagesIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  icon: ImagesIcon,
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
      rows: 3,
    }),
    defineField({
      name: 'year',
      type: 'number',
    }),
    defineField({
      name: 'location',
      type: 'string',
    }),
    defineField({
      name: 'people',
      title: 'People tagged',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'person'}]})],
    }),
    defineField({
      name: 'photos',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', type: 'string', title: 'Alternative text'}),
            defineField({name: 'caption', type: 'string'}),
            defineField({
              name: 'people',
              title: 'People in this photo',
              type: 'array',
              of: [defineArrayMember({type: 'reference', to: [{type: 'person'}]})],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      year: 'year',
      media: 'photos.0',
    },
    prepare({title, year, media}) {
      return {
        title,
        subtitle: year ? String(year) : undefined,
        media,
      }
    },
  },
})
