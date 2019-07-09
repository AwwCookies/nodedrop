<template>
  <div>
    <b-table striped hover :items="ignorelist" :fields="['host', 'reason', 'time', 'delete']">
      <template slot="delete" slot-scope="data">
        <b-button @click="removeIgnore(data.item._id.toString())" variant="danger">Delete</b-button>
      </template>
    </b-table>
    <b-button @click="getIgnoreList">Refresh</b-button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "UserTable",
  data() {
    return {
      ignorelist: [],
      fields: ["username", "role"],
      edit: {
        ircAccount: "",
        role: "",
        id: ""
      }
    };
  },
  mounted() {
    this.getIgnoreList();
  },
  methods: {
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
    }
  }
};
</script>

<style>
</style>
