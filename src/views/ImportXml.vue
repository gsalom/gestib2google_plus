<template>
  <div>
    <!-- Form importar -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Importar fitxer XML de GestIB</h6>
      </div>
      <div class="card-body">
        <form @submit.prevent>
          <div class="form-group">
            <div class="custom-file">
              <input type="file" id="xmlfile" name="xmlfile"  class="custom-file-input" required="required" placeholder="Fitxer XML de GestIB" @change="loadXmlFile" :disabled="loading">
              <label class="custom-file-label" for="xmlfile">{{ xmlFile ? xmlFile.name: 'Fitxer XML de GestIB' }}</label>
            </div>
          </div>
          <div class="form-group">
            <label for="group" class="col-sm col-form-label">Grup d'alumnes</label>
            <div class="col-sm-10">
              <select class="form-control" id="group" name="group" v-model="group" :disabled="loading">
                <option value="">Tots</option>
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
          </div>
          <button class="btn btn-primary" v-on:click="importGestib(false)" :disabled="loading">
            <span v-if="loading || importing" class="spinner-border spinner-border-sm"></span>
            {{ loading && !importing ? 'Simulant importació ...' : 'Simular importació' }}
          </button>
        </form>
      </div>
    </div>
    <!-- Fi Form importar -->
    <div class="alert alert-danger alert-dismissible fade show" role="alert" v-for="(error, index) in errors" v-bind:key="index">
      <strong>ERROR: </strong>{{error}}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <b-modal id="modal-ok" title="GestIB2Google" ok-only>
      <p class="my-4">Procés finalitzat!</p>
    </b-modal>
    <!-- Taula mostrar usuaris -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Importació</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Informació d'importació</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(log, index) in logs" v-bind:key="index">
                <td>{{ log }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button class="btn btn-primary" v-on:click="importGestib(true)" :disabled="loading || !logs.length">
          <span v-if="loading || importing" class="spinner-border spinner-border-sm"></span>
          {{ loading && importing ? 'Important ...' : 'Importar' }}
        </button>
        <button class="btn btn-primary" v-on:click="saveLog()" :disabled="loading || !logs.length">
          Guardar informació d'importació a fitxer de text
        </button>
      </div>
    </div>
    <!-- Fi taula mostrar usuaris -->
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import {getDomainUsers} from '@/api/DomainRead'
import {applyDomainChanges} from '@/api/DomainOperations'
import {readXmlFile} from '@/api/XmlFile'

export default {
  name: 'ImportXml',
  data () {
    return {
      xmlFile: null,
      group: '',
      onlyteachers: false,
      errors: [],
      loading: false,
      importing: false,
      groupsStudents: [],
      logs: []
    }
  },
  mounted () {
    this.groupsStudents = JSON.parse(sessionStorage.groupsStudents)
  },
  methods: {
    loadXmlFile (event) {
      // Guardam la informació del fitxer que hem de carregar a xmlFile
      this.xmlFile = event.target.files[0]
    },
    importGestib (apply) {
      // Comprovar que hem posat un fitxer al <input>
      if (this.xmlFile) {
        this.loading = true
        this.importing = apply
        this.logs = []

        // Llegim el fitxer XML com a text
        const reader = new FileReader()
        reader.onload = (evt) => {
          readXmlFile(reader.result, this.logs, (err, xmlusers) => {
            if (err) {
              this.errors.push('Error llegint XML "' + err.message + '"')
              this.loading = false
            } else {
              // LLegim els usuaris del domini
              getDomainUsers(this.logs, (err, domainusers, domaingroups) => {
                if (err) {
                  this.errors.push('Error llegint els usuaris del domini "' + err.message + '"')
                  this.loading = false
                } else {
                  // Aplicam els canvis al domini
                  applyDomainChanges(this.logs, xmlusers, domainusers, domaingroups, apply, this.group, this.onlyteachers, false, (err, count) => {
                    if (err) {
                      this.errors.push('Error aplicant els canvis al domini "' + err.message + '"')
                      this.loading = false
                    } else {
                      // Si tot ha anat bé, mostram el resum
                      if (apply) {
                        this.logs.push(count.deleted + ' usuaris han estat suspesos')
                        this.logs.push(count.created + ' usuaris han estat creats')
                        this.logs.push(count.activated + ' usuaris han estat activats')
                        this.logs.push(count.membersmodified + ' usuaris han canviat de grup/s')
                        this.logs.push(count.orgunitmodified + ' usuaris han canviat d\'unitat organitzativa')
                        this.logs.push(count.groupscreated + ' grups han estat creats')
                      } else {
                        this.logs.push(count.deleted + ' usuaris seran suspesos')
                        this.logs.push(count.created + ' usuaris seran creats')
                        this.logs.push(count.activated + ' usuaris seran activats')
                        this.logs.push(count.membersmodified + ' usuaris canviaran de grup/s')
                        this.logs.push(count.orgunitmodified + ' usuaris canviaran d\'unitat organitzativa')
                        this.logs.push(count.groupscreated + ' grups seran creats')
                      }
                      this.loading = false
                      this.$bvModal.show('modal-ok')
                    }
                  })
                }
              })
            }
          })
        }
        reader.readAsText(this.xmlFile)
      } else {
        // No hem posat un fitxer al <input>
        this.errors.push('Heu d\'especificar el fitxer XML de GestIB')
      }
    },
    saveLog () {
      let blob = new Blob([this.logs.join('\r\n')], { type: 'text/plain;charset=utf-8' })
      let fileName = 'import' + (new Date()).toLocaleString() + '.txt'
      saveAs(blob, fileName)
    }
  }
}
</script>

<style>

</style>
