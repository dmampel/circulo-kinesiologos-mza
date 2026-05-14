## ADDED Requirements

### Requirement: NoticiaRepository.update

The system MUST expose an `update(id, data)` method on `NoticiaRepository` that persists changes to an existing noticia.

#### Scenario: Actualización exitosa

- GIVEN a valid noticia `id` and a partial data object
- WHEN `NoticiaRepository.update(id, data)` is called
- THEN the system MUST call `prisma.noticia.update({ where: { id }, data })`
- AND MUST return the updated record.
