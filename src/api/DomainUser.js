import {config} from '@/config'

const pad = (num, size) => {
  let s = num + ''
  while (s.length < size) {
    s = '0' + s
  }
  return s
}

/*
 * Eliminar accents, ñ, ...
 */
const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const normalizedName = (name) => {
  let tokens = removeAccents(name.toLowerCase()).split(' ')
  let names = []
  // Words with compound names and surnames
  const especialTokens = ['da', 'de', 'di', 'do', 'del', 'la', 'las', 'le', 'los',
    'mac', 'mc', 'van', 'von', 'y', 'i', 'san', 'santa', 'al', 'el']

  tokens.forEach(token => {
    if (especialTokens.indexOf(token) < 0) { // If token not in especialTokens
      names.push(token)
    }
  })

  if (names.length >= 1) { // If name exists (with name or surname)
    return names[0]
  } else { // If name not exists (without name or surname)
    return '_'
  }
}

/*
 * Classe per guardar la informació dels usuaris
 */
class DomainUser {
  constructor (id, name, surname, surname1, surname2, domainemail, suspended,
    teacher, withoutcode, groups, expedient, organizationalUnit, lastLoginTime) {
    this.id = id
    this.name = name
    this.surname1 = surname1
    this.surname2 = surname2
    this.surname = surname
    this.domainemail = domainemail
    this.suspended = suspended
    this.teacher = teacher
    this.withoutcode = withoutcode
    this.groups = groups
    this.expedient = expedient
    this.organizationalUnit = organizationalUnit
    this.lastLoginTime = lastLoginTime
  }

  /**
   * Retorna l'email de l'usuari
   * @param numero Si no és undefined, fa que retorni el email amb número, per evitar col·lisions
   */
  email (numero) {
    if (this.domainemail) {
      return this.domainemail
    } else {
      let email = ''
      // Agafam format de professor o alumne
      if (this.teacher) {
        email = config().teachersEmailFormat
      } else {
        email = config().studentsEmailFormat
      }
      // Reemplaçam per caràcters invàlids als emails
      // n = ©
      // N = ¡
      // p = ¢
      // P = £
      // s = ¥
      // S = «
      email = email.replace('n', '©').replace('N', '¡')
      email = email.replace('p', '¢').replace('P', '£')
      email = email.replace('s', '¥').replace('S', '«')
      // Reemplaçam els caràcters invàlids per nom i llinatges
      email = email.replace('©', this.name.toLowerCase().substring(0, 1))
      email = email.replace('¡', normalizedName(this.name))
      email = email.replace('¢', normalizedName(this.surname1.substring(0, 1)))
      email = email.replace('£', normalizedName(this.surname1))
      email = email.replace('¥', normalizedName(this.surname2).toLowerCase().substring(0, 1))
      email = email.replace('«', normalizedName(this.surname2))
      if (numero) {
        // Si hi ha numero, l'afegim a l'email per evitar col·lisions
        if (email.includes('0')) {
          // Si hi ha numeros a l'email (0), hem de substituir els numeros
          // Contam nombre de zeros
          let nZeros = email.match(/0/g).length
          email = email.replace(/0+/, pad(numero, nZeros))
        } else {
          // Si no hi ha numeros, hem d'afegir-ne abans de @
          email = email + numero
        }
      }
      // Retornam email amb prefix i domini
      if (this.teacher) {
        return config().teachersEmailPrefix +
          email + '@' +
          (config().teachersEmailCustomDomain ? config().teachersEmailCustomDomain : config().domain)
      } else {
        return config().studentsEmailPrefix +
          email + '@' +
          (config().studentsEmailCustomDomain ? config().studentsEmailCustomDomain : config().domain)
      }
    }
  }

  user () {
    return this.email().replace('@' + config().domain, '')
  }

  groupsWithDomain () {
    let gr = []
    this.groups.forEach(group => {
      gr.push(group + '@' + config().domain)
    })

    return gr
  }

  groupsWithPrefix () {
    let gr = []
    this.groups.forEach(group => {
      if (group.startsWith(config().groupPrefixStudents) || group.startsWith(config().groupPrefixTeachers) || group.startsWith(config().groupPrefixTutors) || group.startsWith(config().groupPrefixDepartment)) {
        gr.push(group)
      }
    })

    return gr
  }

  groupsWithPrefixAdded () {
    return this.groups
  }

  toString () {
    // toString override added to prototype of DomainUser class
    return (this.teacher ? 'PROFESSOR ' : 'ALUMNE ') +
      this.surname + ', ' +
      this.name + ' (' +
      this.email() + ') [' +
      this.groups + ']'
  }
}

export {DomainUser}
