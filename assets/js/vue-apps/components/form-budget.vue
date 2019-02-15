<script>
import { Decimal } from 'decimal.js';

export default {
    props: [],
    data() {
        return {
            items: [
                {
                    name: 'Catering',
                    cost: new Decimal(128.45)
                },
                {
                    name: 'Misc',
                    cost: new Decimal(84)
                }
            ],
            deletedItem: null
        };
    },
    computed: {
        total() {
            let t = this.items.reduce((acc, cur) => {
                return acc.plus(cur.cost);
            }, new Decimal(0));
            return '£' + t.toFixed(2);
        },
        canAddNewItem() {
            if (this.items.length === 0) {
                return true;
            }
            const lastItem = this.items[this.items.length - 1];
            return lastItem.name && lastItem.cost > 0;
        }
    },
    methods: {
        addItem: function(item = { name: '', cost: new Decimal(0) }) {
            this.items.push(item);
        },
        removeItem: function(item) {
            this.deletedItem = item;
            this.items = this.items.filter(i => i !== item);
        },
        restoreLastDeletedItem: function() {
            this.addItem(this.deletedItem);
            this.deletedItem = null;
        }
    }
};
</script>

<template>
    <div>
        <div v-if="deletedItem && deletedItem.name">
            "{{ deletedItem.name }}" was removed.
            <button class="btn btn--small btn--outline" v-on:click="restoreLastDeletedItem()">Undo</button>
        </div>
        <table class="table table-striped mb-5">
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Cost</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in items" :key="index">
                    <td><input type="text" v-model="item.name" placeholder="Type a budget item name..." /></td>
                    <td><input step=".01" type="number" min="0" v-model="item.cost" /></td>
                    <td>
                        <button class="btn btn--small btn--outline" v-on:click="removeItem(item)">
                            Remove this item
                        </button>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td>
                        <button class="btn btn--small" v-on:click="addItem()" :disabled="!canAddNewItem">
                            Add new item
                        </button>
                    </td>
                    <td></td>
                    <td><strong>Total:</strong> {{ total }}</td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
