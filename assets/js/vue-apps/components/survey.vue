<script>
import $ from 'jquery';

const statuses = {
    NOT_ASKED: 'NOT_ASKED',
    MESSAGE_BOX_SHOWN: 'MESSAGE_BOX_SHOWN',
    SUBMISSION_SUCCESS: 'SUBMISSION_SUCCESS',
    SUBMISSION_ERROR: 'SUBMISSION_ERROR'
};

export default {
    data() {
        return {
            statuses: statuses,
            status: statuses.NOT_ASKED,
            lang: null,
            response: {
                choice: null,
                message: null,
                path: window.location.pathname
            }
        };
    },
    created: function() {
        $.get(`${window.AppConfig.localePrefix}/survey`).then(response => {
            this.lang = response;
        });
    },
    methods: {
        storeResponse(choice) {
            this.response.choice = choice;

            $.ajax({
                url: `/survey`,
                type: 'POST',
                dataType: 'json',
                data: this.response
            }).then(response => {
                if (response.status === 'success') {
                    this.status = this.statuses.SUBMISSION_SUCCESS;
                } else {
                    this.status = this.statuses.SUBMISSION_ERROR;
                }
            }, () => (this.status = this.statuses.SUBMISSION_ERROR));
        },
        selectChoice(choice) {
            if (choice === 'yes') {
                this.storeResponse(choice);
            } else if (choice === 'no') {
                this.status = statuses.MESSAGE_BOX_SHOWN;
            }
        },
        resetChoice() {
            this.status = statuses.NOT_ASKED;
        }
    }
};
</script>

<template>
    <aside role="complementary" class="survey" v-if="lang">
        <div class="inner">
            <div class="survey__choices" v-if="status === statuses.NOT_ASKED">
                <p class="survey__choices-question">{{ lang.question }}</p>
                <div class="survey__choices-actions">
                    <button class="btn btn--small survey__choice" type="button"
                        v-on:click="selectChoice('yes')"
                    >{{ lang.yes }}</button>
                    <button class="btn btn--small survey__choice" type="button"
                        v-on:click="selectChoice('no')"
                    >{{ lang.no }}</button>
                </div>
            </div>

            <p class="survey__response" v-if="status === statuses.SUBMISSION_SUCCESS">
                {{ lang.success }}
            </p>

            <p class="survey__response" v-if="status === statuses.SUBMISSION_ERROR">
                {{ lang.error }}
            </p>

            <div class="survey__extra" v-if="status === statuses.MESSAGE_BOX_SHOWN">
                <form class="survey__form" v-on:submit.prevent="storeResponse('no')">
                    <div class="survey__form-fields">
                        <label class="ff-label" for="survey-extra-msg">{{ lang.prompt }}</label>
                        <textarea class="ff-textarea" id="survey-extra-msg" v-model="response.message"></textarea>
                    </div>
                    <div class="survey__form-actions">
                        <input type="submit" class="btn btn--small" :value="lang.submit" />
                        <button type="reset" class="btn-link" v-on:click="resetChoice">{{ lang.cancel }}</button>
                    </div>
                </form>
            </div>
        </div>
    </aside>
</template>
