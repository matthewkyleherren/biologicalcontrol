import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title('Programme')
        .id('programme')
        .child(S.document().schemaType('programme').documentId('programme')),
      S.divider(),
      S.documentTypeListItem('story').title('Stories'),
      S.documentTypeListItem('person').title('People'),
      S.documentTypeListItem('gallery').title('Galleries'),
      S.documentTypeListItem('themeTag').title('Themes'),
    ])
