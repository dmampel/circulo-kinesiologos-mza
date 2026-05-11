# Circulares Management Specification

## Purpose
Define the internal capabilities for administrators to create, read, update, and delete institutional circulares specifically targeted at partners/members.

## Requirements

### Requirement: Crear Circular
The system MUST allow an admin to create a new circular with title, content, tag, optional file url, and publication status.

#### Scenario: Admin creates a draft circular
- GIVEN the admin is on the new circular page
- WHEN they fill in title and tag and save as draft
- THEN the circular is saved with `publicada = false`
- AND the publication date is null

#### Scenario: Admin publishes a circular
- GIVEN the admin is on the new circular page
- WHEN they fill in the details and check publish
- THEN the circular is saved with `publicada = true`
- AND `publicada_en` is set to the current timestamp

### Requirement: Listar Circulares
The system MUST display all circulares to the admin in a tabular format ordered by creation date descending.

#### Scenario: Admin views circulares list
- GIVEN circulares exist in the database
- WHEN the admin visits `/admin/circulares`
- THEN they see a list with title, tag, status, and publication date

### Requirement: Editar y Eliminar Circular
The system MUST allow an admin to modify an existing circular or delete it.

#### Scenario: Admin updates circular tag
- GIVEN an existing circular
- WHEN the admin edits the circular and changes the tag
- THEN the database is updated with the new tag value

#### Scenario: Admin deletes a circular
- GIVEN an existing circular
- WHEN the admin clicks the delete action
- THEN the circular is permanently removed from the database
