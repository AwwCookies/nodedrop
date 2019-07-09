<template>
  <div>
    <b-button class="float-right" @click="$bvModal.show('add');">Add Ignore</b-button>
    <b-button class="float-right" @click="deleteAll">Delete All</b-button>
    <b-modal id="add" title="Add Ignore">
      <b-form>
        <b-form-group id="host" label="Host" label-for="host">
          <b-form-input id="host" v-model="edit.host" required placeholder="host"></b-form-input>
        </b-form-group>
        <b-form-group id="reason" label="Reason" label-for="reason">
          <b-form-input id="reason" v-model="edit.reason" required placeholder="reason"></b-form-input>
        </b-form-group>
      </b-form>
      <template slot="modal-footer" slot-scope="{ ok, cancel, hide }">
        <b-button variant="success" @click="addIgnore()">Add</b-button>
        <b-button variant="primary" @click="cancel()">Close</b-button>
      </template>
    </b-modal>
    <b-table
      striped
      hover
      :items="ignorelist"
      :fields="['host', 'reason', 'time', 'delete']"
      :per-page="prePage"
      :current-page="curPage"
    >
      <template slot="delete" slot-scope="data">
        <b-button @click="removeIgnore(data.item._id.toString())" variant="danger">Delete</b-button>
      </template>
    </b-table>
    <b-button @click="getIgnoreList">Refresh</b-button>
    <b-pagination v-model="curPage" :total-rows="ignorelist.length" :pre-page="prePage" aria-controls="ignorelist"/>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "UserTable",
  data() {
    return {
      ignorelist: [],
      curPage: 1,
      prePage: 10,
      fields: ["username", "role"],
      edit: {
        host: "",
        reason: ""
      }
    };
  },
  mounted() {
    this.getIgnoreList();
  },
  methods: {
    deleteAll() {
      const _this = this;
      axios
        .delete("/api/v1/admin/ignorelist", { withCredentials: true })
        .then(response => {
          if (response.data.statusText === "done") {
            console.log("deleted all");
            this.getIgnoreList();
          }
        });
    },
    getIgnoreList() {
      const _this = this;
      axios
        .get("/api/v1/admin/ignorelist", { withCredentials: true })
        .then(response => {
          _this.ignorelist = response.data.ignorelist;
        });
    },
    removeIgnore(id) {
      const _this = this;
      axios
        .delete(`/api/v1/admin/ignorelist/${id}`, { withCredentials: true })
        .then(response => {
          _this.getIgnoreList();
        });
    },
    addIgnore() {
      const _this = this;
      axios
        .put(
          `/api/v1/admin/ignorelist`,
          {
            host: this.edit.host,
            reason: this.edit.reason
          },
          { withCredentials: true }
        )
        .then(response => {
          _this.getIgnoreList();
          // alertify.notify('sample', 'success', 5, function(){  console.log('dismissed'); });
        });
    }
  }
};
</script>

<style>
</style>
