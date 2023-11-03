<template>
  <div>
    <!-- Form full de càlcul -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Exportar a un full de càlcul</h6>
      </div>
      <div class="card-body">
        <div class="alert alert-warning" role="alert">
          ATENCIÓ: No es poden exportar més de 30 grups, degut a que hi ha un límit de 60 escriptures
          als fulls de càlcul de Google per minut. Ho podeu consultar a
          <a href="https://developers.google.com/analytics/devguides/config/mgmt/v3/limits-quotas">"Límites y cuotas en las solicitudes a API"</a> i a
          <a href="https://developers.google.com/sheets/api/limits">"Usage Limits"</a>
        </div>
        <form @submit.prevent>
          <div class="form-group">
            <label for="groupsdomainuserscsv" class="col-sm col-form-label">Grup d'alumnes</label>
            <div class="col-sm-10">
              <select class="form-control" id="group" name="group" v-model="group" :disabled="loading">
                <option value="">Tots</option>
                <option v-for="prefixGroup in ciclesPrefixGroups" v-bind:key="prefixGroup" v-bind:value="'alumnat.'+prefixGroup" >
                  {{ prefixGroup+'*' }}
                </option>
                <option v-for="group in groupsStudents" v-bind:key="group.email" v-bind:value="group.email">
                  {{ group.nameWithEmail }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <div class="form-check">
              <label class="form-check-label">
              <input class="form-check-input" id="onlyteachers" name="onlyteachers" type="checkbox" v-model="onlyteachers" :disabled="loading"> Només professorat</label>
            </div>
              <div class="form-check"> 
              <label class="form-check-label">
              <input class="form-check-input" id="showgroups" name="showgroups" type="checkbox" v-model="showgroups" :disabled="loading"> Afegir grups de professorat</label>
            </div>
          </div>
          <div class="form-group">
            <button class="btn btn-primary" v-on:click="spreadsheet()" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm"></span>
              {{ loading ? 'Exportant ...' : 'Exportar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Fi form full de càlcul -->
    <div class="alert alert-danger alert-dismissible fade show" role="alert" v-for="(error, index) in errors" v-bind:key="index">
      <strong>ERROR: </strong>{{error}}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <b-modal id="modal-ok" title="GestIB2Google" ok-only>
      <p class="my-4">Procés finalitzat!<br>Fitxer guardat a 'La meva unitat' de Google Drive amb el nom '{{ filename }}'.</p>
    </b-modal>
  </div>
</template>

<script>
import {getDomainUsers} from '@/api/DomainRead'
import {oauth2ClientServiceSheets} from '@/api/Oauth2Client'
import {config} from '@/config'

export default {
  name: 'Spreadsheet',
  data () {
    return {
      group: '',
      onlyteachers: false,
      showgroups: false,
      errors: [],
      loading: false,
      groupsStudents: [],
      ciclesPrefixGroups:[],
      filename: ''
    }
  },
  mounted () {
    this.groupsStudents = JSON.parse(sessionStorage.groupsStudents),
    this.ciclesPrefixGroups= config().ciclesPrefixGroups
  },
  methods: {
    spreadsheet () {
      this.loading = true
      getDomainUsers(null, (err, users) => {
        if (err) {
          this.errors.push('Error llegint usuaris "' + err.message + '"')
          this.loading = false
        } else {
          // Array amb informació a exportar al full de càlcul
          let sheetUsers = []
          // Per cada usuari del domini...
          Object.keys(users).forEach(user => {
            if (!users[user].suspended) {
             if (!this.onlyteachers || users[user].teacher) {
                //console.log(this.group)   
                if (users[user].teacher && this.onlyteachers){
                  this.group=this.group.replace("alumnat", "professorat");                  
                }
                //console.log(this.group) 
                if (!this.group || users[user].groups.findIndex(grup => grup.startsWith(this.group))!=-1) {
                  // Grup professorat
                  if (users[user].teacher) {
                    if (!sheetUsers['Professorat']) {
                      sheetUsers['Professorat'] = []
                    }
                    // showgroups checkbox amb grups o sense
                    if (this.showgroups) {
                      sheetUsers['Professorat'].push([
                        users[user].surname + ', ' + users[user].name,
                        users[user].domainemail].concat(users[user].groups)
                      )}
                      else {
                      sheetUsers['Professorat'].push([
                        users[user].surname + ', ' + users[user].name,
                        users[user].domainemail])
                    }
                  }
                  // Grups alumnes
                  users[user].groups.forEach(group => {
                    if (group.includes(config().groupPrefixStudents)) {
                      if (!sheetUsers[group]) {
                        sheetUsers[group] = []
                      }
                      sheetUsers[group].push([
                        users[user].surname + ', ' + users[user].name,
                        users[user].domainemail]
                      )
                    }
                  })
                }
                
              }
              if (users[user].teacher && this.onlyteachers){
                  this.group=this.group.replace("professorat","alumnat");                  
                }
            }
          })
          // Ordenam per grup
          let sheetUsersOrdered = []
          Object.keys(sheetUsers).sort().forEach(key => {
            sheetUsersOrdered[key] = sheetUsers[key]
          })
         if (this.onlyteachers){
          this.filename = 'Professorat '+ this.group + ' '+ (new Date()).toLocaleString()
           // console.log(this.filename)
         }
          else {
          if (!this.group){
            this.filename = 'Usuaris domini ' + (new Date()).toLocaleString()
           // console.log(this.filename)
          }
          else {
          this.filename = 'Usuaris '+ this.group + ' '+ (new Date()).toLocaleString()
          // console.log(this.filename)
          }
        }
          // Cream el full de càlcul a Google Drive
          // https://developers.google.com/sheets/api/guides/create#nodejs
          oauth2ClientServiceSheets().spreadsheets.create({
            resource: {
              properties: {
                title: this.filename
              }
            },
            fields: 'spreadsheetId'
          }, (err, spreadsheet) => {
            if (err) {
              this.errors.push('Error creant el full de càlcul "' + err.message + '"')
              this.loading = false
            } else {
              // Si s'ha creat correctament el full de càlcul...
              let spreadsheetId = spreadsheet.data.spreadsheetId
              this.addSheet(spreadsheetId, sheetUsersOrdered, 0, () => {
                this.loading = false
                this.$bvModal.show('modal-ok')
              })
            }
          })
        }
      })
    },
    addSheet (spreadsheetId, sheetUsersOrdered, index, callback) {
      let groups = Object.keys(sheetUsersOrdered)
      if (index >= groups.length) {
        // Hem arribat al final de l'array. Tornar
        callback()
      } else {
        // Per cada grup...
        let group = groups[index]

        // Ordenam alfabèticament els membres del grup
        sheetUsersOrdered[group].sort((a, b) => a.toString().localeCompare(b))
        // Afegim capçalera
        sheetUsersOrdered[group].unshift(['Nom', 'Email'])

        // Afegim un nou full per cada grup
        oauth2ClientServiceSheets().spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            requests: {
              addSheet: {
                properties: {
                  title: group
                }
              }
            }
          }
        }, (err, response) => {
          if (err) {
            this.errors.push('Error afegint el grup "' + group + '" al full de càlcul "' + err.message + '"')
            this.loading = false
          } else {
            // En acabar d'afegir el primer grup, eliminar el primer full
            if (index === 0) {
              oauth2ClientServiceSheets().spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                  requests: {
                    deleteSheet: {
                      sheetId: 0
                    }
                  }
                }
              }, (err) => {
                if (err) {
                  this.errors.push('Error esborrant les pàgines buides del full de càlcul "' + err.message + '"')
                  this.loading = false
                }
              })
            }

            // Afegim valors (membres del grup) al full
            oauth2ClientServiceSheets().spreadsheets.values.update({
              spreadsheetId: spreadsheetId,
              range: group + '!A1',
              valueInputOption: 'USER_ENTERED',
              resource: {
                values: sheetUsersOrdered[group]
              }
            }, (err, response) => {
              if (err) {
                this.errors.push('Error afegint les dades del grup "' + group + '" al full de càlcul "' + err.message + '"')
                this.loading = false
              } else {
                // Cridam recursivament el següent grup
                this.addSheet(spreadsheetId, sheetUsersOrdered, index + 1, callback)
              }
            })
          }
        })
      }
    }
  }
}
</script>

<style>

</style>
