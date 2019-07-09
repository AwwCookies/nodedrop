<template>
  <div>
    <b-button variant="primary">Add User</b-button>
    <b-table striped hover :items="users" :fields="['username', 'role', 'edit', 'delete']">
      <template slot="edit" slot-scope="data">
        <b-button variant="info">Edit</b-button>
      </template>
      <template slot="delete" slot-scope="data">
        <b-button @click="removeUser(data.item._id.toString())" variant="danger">Delete</b-button>
      </template>
    </b-table>
    <b-button @click="getUsers">Load</b-button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "UserTable",
  data() {
    return {
      users: [],
      fields: ["username", "role"]
    };
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    removeUser(id) {
      const _this = this;
      axios
        .delete(`/api/v1/admin/user/${id}`, { withCredentials: true })
        .then(response => {
          _this.getUsers();
        });
    },
    editUser(ircAccount, role) {
      const _this = this;
      axios
        .put(
          `/api/v1/admin/user/${this.comp.users.id}`,
          {
            ircAccount,
            role
          },
          { withCredentials: true }
        )
        .then(response => {
          console.log(response);
          _this.getUsers();
        })
        .catch(err => {
          console.error(err);
        });
    },
    async getUsers() {
      const _this = this;
      axios
        .get("/api/v1/admin/users", { withCredentials: true })
        .then(response => {
          console.log(response);
          _this.users = response.data.users;
        });
    }
  }
  // mounted() {
  //   this.getUsers();
  // }
};
</script>

<style>
</style>
