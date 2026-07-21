import {DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const story = defineType({
  name: 'story',
  title: 'Story',
  type: 'document',
  icon: DocumentTextIcon,
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
      name: 'excerpt',
      type: 'text',
      rows: 3,
      description: 'One or two lines for listings — the hook',
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: 'year',
      type: 'number',
      description: 'Approximate year the events took place',
      validation: (rule) => rule.min(1975).max(2005),
    }),
    defineField({
      name: 'era',
      type: 'string',
      options: {
        list: [
          {title: '1979–1982 · Finding the wasp', value: 'finding'},
          {title: '1982–1986 · Mass rearing & release', value: 'release'},
          {title: '1986–1990 · Continent-wide expansion', value: 'expansion'},
          {title: '1990–1994 · Consolidation & handoff', value: 'handoff'},
          {title: 'After · Looking back', value: 'after'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'location',
      type: 'string',
      description: 'Where this story unfolds',
    }),
    defineField({
      name: 'narrator',
      type: 'reference',
      to: [{type: 'person'}],
      description: 'Who is telling this story',
    }),
    defineField({
      name: 'people',
      title: 'People tagged',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'person'}]})],
    }),
    defineField({
      name: 'themes',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'themeTag'}]})],
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
        defineField({
          name: 'caption',
          type: 'string',
        }),
      ],
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
            defineField({name: 'alt', type: 'string', title: 'Alternative text'}),
            defineField({name: 'caption', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: 'Year',
      name: 'yearAsc',
      by: [{field: 'year', direction: 'asc'}],
    },
    {
      title: 'Newest published',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      year: 'year',
      narrator: 'narrator.name',
      media: 'mainImage',
    },
    prepare({title, year, narrator, media}) {
      return {
        title,
        subtitle: [year, narrator].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
