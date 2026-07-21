import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      description: 'e.g. Entomologist, Pilot, Lab technician, National collaborator',
    }),
    defineField({
      name: 'yearsActive',
      title: 'Years with the programme',
      type: 'string',
      description: 'e.g. 1981–1989',
    }),
    defineField({
      name: 'location',
      type: 'string',
      description: 'Primary base — e.g. Ibadan, Cotonou, Daloa',
    }),
    defineField({
      name: 'portrait',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
      ],
    }),
    defineField({
      name: 'bio',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'email',
      type: 'string',
      description: 'Optional — used only for profile claims, never shown publicly',
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'role', media: 'portrait'},
  },
})
