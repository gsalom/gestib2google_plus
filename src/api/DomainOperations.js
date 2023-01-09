import {oauth2ClientServiceAdmin} from '@/api/Oauth2Client'
import {DomainUser} from '@/api/DomainUser'
import {config} from '@/config'

/**
 * Aplicar al domini l'eliminació d'un usuari
 */
const applyDeletedomainUser = async (logs, domainUser) => {
  // Eliminar tots els grups
  let groupsWithDomain = domainUser.groupsWithDomain()
  for (let i in groupsWithDomain) {
    // https://developers.google.com/admin-sdk/directory/v1/reference/members/delete
    oauth2ClientServiceAdmin().members.delete({
      groupKey: groupsWithDomain[i],
      memberKey: domainUser.email()
    }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
  }

  // Canvia a les unitats EX
  let orgunit = config().organizationalUnitExStudents;
  if (domainUser.organizationalUnit==config().organizationalUnitTeachers){
    orgunit=config().organizationalUnitExTeachers;
  }

  // Suspendre l'usuari del domini
  oauth2ClientServiceAdmin().users.update({
    userKey: domainUser.email(),
    resource: {
      suspended: true,
      orgUnitPath: orgunit
    }
  }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })

}

/**
 * Esborrar dels grups els usuaris desactivats que no estan al XML
 */
 const purgeGroupsDomainUsers = (logs, domainUsers, apply, selectedGroup, onlyTeachers) => {
  let countPurged = 0
  logs.push('Purgant dels grups usuaris desactivats del domini  ...')
  for (let userid in domainUsers) { // Per cada usuari del domini
    let domainUser = domainUsers[userid]
    if (domainUser.suspended) {
        // Aplicar només al grup seleccionat
        if (!selectedGroup || domainUser.groups.includes(selectedGroup)) {
          if (domainUser.groups.length>0) {
          // Si només hem escollit professors...
          if (!onlyTeachers || domainUser.teacher) {
            // Aplicar només les unitats organitzatives 'Professorat', 'Alumnat','ExProfessorat', 'ExAlumnat' i  '/'
            if (['/', config().organizationalUnitTeachers, config().organizationalUnitStudents, config().organizationalUnitExTeachers, config().organizationalUnitExStudents].includes(domainUser.organizationalUnit)) {
              logs.push('PURGAR: ' + domainUser.toString())
              countPurged++
if (apply) {
      // Actualitzam els grups de l'usuari
      for (let gr in domainUser.groups) {
        // https://developers.google.com/admin-sdk/directory/v1/reference/members/delete
        oauth2ClientServiceAdmin().members.delete({
          groupKey:domainUser.groups[gr] + '@' + config().domain,
          memberKey: domainUser.email()
        }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
      }    
            }
          }
          }
                 
        }        
      }
    }
  }
  return countPurged
}





/**
 * Esborrar del domini els usuaris que no estan al XML
 */
const deleteDomainUsers = (logs, xmlUsers, domainUsers, apply, selectedGroup, onlyTeachers) => {
  let countDeleted = 0
  logs.push('Esborrant usuaris del domini...')
  for (let userid in domainUsers) { // Per cada usuari del domini
    let domainUser = domainUsers[userid]
    if (!domainUser.suspended && !domainUser.withoutcode) {
      if (!(domainUser.id in xmlUsers)) { // No existeix al fitxer XML
        // Aplicar només al grup seleccionat
        if (!selectedGroup || domainUser.groups.includes(selectedGroup)) {
          // Si només hem escollit professors...
          if (!onlyTeachers || domainUser.teacher) {
            // Aplicar només les unitats organitzatives 'Professorat', 'Alumnat' i '/'
            if (['/', config().organizationalUnitTeachers, config().organizationalUnitStudents].includes(domainUser.organizationalUnit)) {
              logs.push('SUSPENDRE: ' + domainUser.toString())
              countDeleted++
              if (apply) {
                // Si hem d'aplicar els canvis...
                applyDeletedomainUser(logs, domainUser)
              }
            }
          }
        }
      }
    }
  }
  return countDeleted
}

/**
 * Cream el grup que no existeixi al domini
 */
const createGroupCount = (logs, gr, domainGroupsCount) => {
  // Si el grup no existeix, el cream
  if (!(gr in domainGroupsCount)) {
    domainGroupsCount[gr] = { email: gr + '@' + config().domain }
    logs.push('CREAR GRUP: ' + gr + '@' + config().domain)
    return 1 // Retornam el nombre de grups creats
  } else {
    return 0 // Retornam el nombre de grups creats
  }
}

/**
 * Cream el grup que no existeixi al domini
 */
const createGroup = (logs, gr, domainGroups, callback) => {
  // Si el grup no existeix, el cream
  if (!(gr in domainGroups)) {
    domainGroups[gr] = { email: gr + '@' + config().domain }
    // Afegim grup al domini
    // https://developers.google.com/admin-sdk/directory/reference/rest/v1/groups/insert
    oauth2ClientServiceAdmin().groups.insert({
      resource: {
        email: gr + '@' + config().domain
      }
    }, (err) => {
      if (err) {
        logs.push('ERROR de l\'API de Google: ' + err)
      }
      callback(err)
    })
  } else {
    callback(null)
  }
}

/**
 * Actualitzar els grups del que és membre l'usuari del domini
 */
const updateMemberDomainUser = (logs, apply, creategroups, deletegroups, domainUser, domainGroups, domainGroupsCount) => {
  let countMembersModified = 0
  let countGroupsCreated = 0

  // Primer contam quants de grups es crearan
  for (let gr in creategroups) {
    countGroupsCreated = countGroupsCreated +
      createGroupCount(logs, creategroups[gr], domainGroupsCount)
  }

  // Tant si estava actiu com no, existeix, i per tant, actualitzar
  // els grups groupPrefixDepartment, groupPrefixTeachers,
  // groupPrefixStudents i groupPrefixTutors
  if (((creategroups.length > 0) || (deletegroups.length > 0)) && (!domainUser.suspended)) {
    if (deletegroups.length > 0) {
      logs.push('ESBORRAR MEMBRE: ' + domainUser.surname + ', ' + domainUser.name + ' (' + domainUser.email() + ') [' + deletegroups + ']')
    }
    if (creategroups.length > 0) {
      logs.push('AFEGIR MEMBRE: ' + domainUser.surname + ', ' + domainUser.name + ' (' + domainUser.email() + ') [' + creategroups + ']')
    }
    countMembersModified++
    if (apply) {
      // Actualitzam els grups de l'usuari
      for (let gr in deletegroups) {
        // https://developers.google.com/admin-sdk/directory/v1/reference/members/delete
        oauth2ClientServiceAdmin().members.delete({
          groupKey: deletegroups[gr] + '@' + config().domain,
          memberKey: domainUser.email()
        }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
      }
      for (let gr in creategroups) {
        // https://developers.google.com/admin-sdk/directory/v1/reference/members/insert
        createGroup(logs, creategroups[gr], domainGroups, (err) => {
          if (!err) {
            oauth2ClientServiceAdmin().members.insert({
              groupKey: creategroups[gr] + '@' + config().domain,
              resource: {
                email: domainUser.email()
              }
            }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
          }
        })
      }
    }
  }
  return {
    countMembersModified: countMembersModified,
    countGroupsCreated: countGroupsCreated
  }
}

/**
 * Estableix el nou email de l'usuari que hem de crear
 */
const getNewDomainEmail = (xmlUser, domainUsers) => {
  let numero
  // Cercam el email al domini
  for (let dUser in domainUsers) {
    if (domainUsers[dUser].email() === xmlUser.email(numero)) {
      // Si el trobam, afegim +1 al email
      numero = (numero || 0) + 1
    }
  }
  if (numero) {
    return xmlUser.email(numero)
  } else {
    return null
  }
}

/**
 * Cream l'usuari del XML que no està al domini
 */
 const createDomainUser = async (logs, apply, xmlUser, domainUsers, domainGroups, domainGroupsCount) => {
  let countCreated = 1
  let countGroupsCreated = 0

  // Primer contam quants de grups es crearan
  for (let gr in xmlUser.groupsWithPrefixAdded()) {
    countGroupsCreated = countGroupsCreated +
      createGroupCount(logs, xmlUser.groupsWithPrefixAdded()[gr], domainGroupsCount)
  }

  // Email pot ser repetit, comprovar-ho!!
  // Si trobam un usuari amb email repetit, generam nou email i guardam
  let newEmail = getNewDomainEmail(xmlUser, domainUsers)
  if (newEmail) {
    xmlUser.domainemail = newEmail
  }

  logs.push('CREAR USUARI: ' + xmlUser.toString())

  // Afegim l'usuari que cream al diccionari de usuaris del domini
  domainUsers[xmlUser.id] = new DomainUser(
    xmlUser.id,
    xmlUser.name,
    xmlUser.surname1,
    xmlUser.surname2,
    xmlUser.surname,
    xmlUser.email(), // domainemail
    xmlUser.suspended, // suspended
    xmlUser.teacher, // teacher
    xmlUser.withoutcode, // withoutcode
    xmlUser.groups, // groups
    xmlUser.expedient, // expedient
    xmlUser.organizationalUnit, // organizationalUnit
    xmlUser.lastLoginTime // lastLoginTime
  )

  if (apply) {
    // Create domain user
    // https://developers.google.com/admin-sdk/reseller/v1/codelab/end-to-end
    oauth2ClientServiceAdmin().users.insert({
      resource: {
        primaryEmail: xmlUser.email(),
        name: { givenName: xmlUser.name, familyName: xmlUser.surname },
        orgUnitPath: (xmlUser.teacher ? config().organizationalUnitTeachers : config().organizationalUnitStudents),
        externalIds: [{ type: 'organization', value: xmlUser.id }],
        suspended: false,
        changePasswordAtNextLogin: true,
        password: config().defaultPassword // Default password
      }
    }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
    
    // Aquí hem d'esperar que l'usuari sigui creat per Google abans de ficar-lo dins els grups
    await new Promise(r => setTimeout(r, 2000));

    // Insert all groupPrefixTeachers, groupPrefixStudents and groupPrefixTutors groups
    for (let gr in xmlUser.groupsWithPrefixAdded()) {
      // https://developers.google.com/admin-sdk/directory/v1/reference/members/insert
      createGroup(logs, xmlUser.groupsWithPrefixAdded()[gr], domainGroups, (err) => {
        if (!err) {
          oauth2ClientServiceAdmin().members.insert({
            groupKey: xmlUser.groupsWithPrefixAdded()[gr] + '@' + config().domain,
            resource: {
              email: xmlUser.email()
            }
          }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
        }
      })
    }
  }
  return {
    countCreated: countCreated,
    countGroupsCreated: countGroupsCreated
  }
}

/**
 * Actualitzar estat 'actiu' de l'usuari del domini
 */
const updateActivateDomainUser = (logs, apply, xmlUser, domainUser) => {
  let countActivated = 0
  if (domainUser.suspended) {
    domainUser.suspended=false;
    logs.push('ACTIVAR: ' + xmlUser.toString())
    countActivated++
    if (apply) {
      // Suspend domain user
      oauth2ClientServiceAdmin().users.update({
        userKey: domainUser.email(),
        resource: {
          suspended: false
        }
      }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
      
    }
  }
  return countActivated
}

/**
 * Actualitzar l'unitat organitzativa de l'usuari del domini
 */
const updateOrgunitDomainUser = (logs, apply, xmlUser, domainUser) => {
  // kkk TODO: Actualitzar unitat organitzativa filla pels alumnes
  let countOrgunitModified = 0
  if (domainUser.organizationalUnit !== (xmlUser.teacher ? config().organizationalUnitTeachers : config().organizationalUnitStudents)) {
    logs.push('CANVIAR UNITAT ORGANITZATIVA: ' +
      domainUser.surname + ', ' + domainUser.name + ' (' +
      domainUser.email() + ') [' +
      (xmlUser.teacher ? config().organizationalUnitTeachers : config().organizationalUnitStudents) + ']')
    countOrgunitModified++
    if (apply) {
      // Actualitzar unitat organtizativa de l'usuari del domini
      oauth2ClientServiceAdmin().users.update({
        userKey: domainUser.email(),
        resource: {
          orgUnitPath: (xmlUser.teacher ? config().organizationalUnitTeachers : config().organizationalUnitStudents)
        }
      }, (err) => { if (err) logs.push('ERROR de l\'API de Google: ' + err) })
    }
  }
  return countOrgunitModified
}

/**
 * Afegir al domini els usuaris que estan al XML i no al domini
 */
const addDomainUsers = (logs, xmlUsers, domainUsers, domainGroups, apply, selectedGroup, onlyTeachers) => {
  let countCreated = 0
  let countActivated = 0
  let countMembersModified = 0
  let countOrgunitModified = 0
  let countGroupsCreated = 0
  logs.push('Actualitzant usuaris del domini...')
  // domainGroupsCount serveix per contar grups que s'han de crear
  // domainGroups serveix per controlar els grups creats
  let domainGroupsCount = Object.assign({}, domainGroups)
  for (let userid in xmlUsers) { // Per cada usuari de l'XML
    let xmlUser = xmlUsers[userid]
    if (!(userid in domainUsers)) {
      // Si no existeix al domini... crear
      // Aplicar només al grup seleccionat
      if (!selectedGroup || xmlUser.groups.includes(selectedGroup)) {
        // Si només hem escollit professors...
        if (!onlyTeachers || xmlUser.teacher) {
          // Afegim l'usuari al domini
          let countCreate = createDomainUser(logs, apply, xmlUser, domainUsers, domainGroups, domainGroupsCount)
          countGroupsCreated = countGroupsCreated + countCreate.countGroupsCreated
          countCreated = countCreated + 1
        }
      }
    } else {
      // Si existeix al domini, actualitzar
      let domainUser = domainUsers[userid]
      // Aplicar només al grup seleccionat
      if (!selectedGroup || xmlUser.groups.includes(selectedGroup) || domainUser.groups.includes(selectedGroup)) {
        // Si només hem escollit professors...
        if (!onlyTeachers || xmlUser.teacher || domainUser.teacher) {
          // Aplicar només les unitats organitzatives 'Professorat', 'Alumnat' i '/'
          if (['/', config().organizationalUnitTeachers, config().organizationalUnitStudents, config().organizationalUnitExTeachers, config().organizationalUnitExStudents].includes(domainUser.organizationalUnit))   {
            // Actualitzam el seu estat de 'activat'
            countActivated = countActivated + updateActivateDomainUser(logs, apply, xmlUser, domainUser)
            let creategroups = xmlUser.groupsWithPrefixAdded().filter(
              (x) => { return domainUser.groupsWithPrefix().indexOf(x) < 0 })
            let deletegroups = domainUser.groupsWithPrefix().filter(
              (x) => { return xmlUser.groupsWithPrefixAdded().indexOf(x) < 0 })
            // Actualitzam els grups dels que és membre
            let countMembers = updateMemberDomainUser(logs, apply, creategroups, deletegroups, domainUser, domainGroups, domainGroupsCount)
            countGroupsCreated = countGroupsCreated + countMembers.countGroupsCreated
            countMembersModified = countMembersModified + countMembers.countMembersModified
            // Actualitzam la seva unitat organitzativa
            countOrgunitModified = countOrgunitModified + updateOrgunitDomainUser(logs, apply, xmlUser, domainUser)
          }
        }
      }
    }
  }
  return {
    created: countCreated,
    activated: countActivated,
    membersmodified: countMembersModified,
    orgunitmodified: countOrgunitModified,
    groupscreated: countGroupsCreated
  }
}

/**
 * Aplicar els canvis del XML al domini de Google
 */
const applyDomainChanges = (logs, xmlUsers, domainUsers, domainGroups, apply, selectedGroup, onlyTeachers, onlypurge, callback) => {
  // Inicialitzar comptadors a zero
  let count = new Object();
  count.deleted=0; count.purged=0; count.created=0; count.activated=0;
  count.membersmodified=0; count.orgunitmodified=0; count.groupscreated=0;
  if(onlypurge) {
    let countPurged = purgeGroupsDomainUsers(logs, domainUsers, apply, selectedGroup, onlyTeachers)
    count.purged = countPurged
    }
  else
    {  
    let countDeleted = deleteDomainUsers(logs, xmlUsers, domainUsers, apply, selectedGroup, onlyTeachers)
    count = addDomainUsers(logs, xmlUsers, domainUsers, domainGroups, apply, selectedGroup, onlyTeachers)
    count.deleted = countDeleted
    count.purged=0
    }
    callback(null, count)
}

export {applyDomainChanges}
