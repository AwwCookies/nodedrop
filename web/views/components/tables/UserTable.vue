<template>
  <div>
    <b-modal id="edit" :title="'Edit User (' + edit.id +')'">
      <b-form>
        <b-form-group id="ircAccount" label="ircAccount" label-for="ircAccount">
          <b-form-input
            id="ircAccount"
            v-model="edit.ircAccount"
            required
            placeholder="irc account"
          ></b-form-input>
        </b-form-group>

        <b-form-group id="role" label="Role" label-for="role">
          <b-form-input id="role" v-model="edit.role" required placeholder="Role"></b-form-input>
        </b-form-group>
      </b-form>
    </b-modal>

    <b-button variant="primary">Add User</b-button>
    <b-table striped hover :items="users" :fields="['username', 'role', 'edit', 'delete']">
      <template slot="edit" slot-scope="data">
        <b-button
          @click="openEditUserModal(data.item._id.toString(), data.item.username, data.item.role)"
          variant="info"
        >Edit</b-button>
      </template>
      <template slot="delete" slot-scope="data">
        <b-button @click="removeUser(data.item._id.toString())" variant="danger">Delete</b-button>
      </template>
    </b-table>
    <b-button @click="getUsers">Refresh</b-button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "UserTable",
  data() {
    return {
      users: [],
      fields: ["username", "role"],
      edit: {
        ircAccount: "",
        role: "",
        id: ""
      }
    };
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    openEditUserModal(id, ircAccount, role) {
      this.edit.id = id;
      this.edit.ircAccount = ircAccount;
      this.edit.role = role;
      this.$bvModal.show("edit");
    },
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
