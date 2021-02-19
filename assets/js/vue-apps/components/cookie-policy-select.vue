<script>
import { storageAvailable } from '../../helpers/storage';


const canStore = storageAvailable('localStorage');
const STORAGE_KEY = 'tnlcommunityfund:cookie-consent';

let newCookiePref = null;

export default {
    props: ['actionsave', 'title', 'message', 'actionsuccess', 'actionfail', 'messageall', 'messageessential' ],
    data() {

        const hasAccepted =
            canStore && (window.localStorage.getItem(STORAGE_KEY) === 'all' || window.localStorage.getItem(STORAGE_KEY) === 'essential');
        return { isShown: hasAccepted === false };
    },
    methods: {
        saveChanges() {
            canStore && window.localStorage.setItem(STORAGE_KEY, newCookiePref);
            if(newCookiePref !== null) {
                document.querySelector(".cookie-success-text").style.display = "block";
                document.querySelector(".cookie-fail-text").style.display = "none";
            }
            else {
                document.querySelector(".cookie-fail-text").style.display = "block";
                document.querySelector(".cookie-success-text").style.display = "none";
            }


        },
        changeCookiePref(cookiePref)
        {
            newCookiePref = cookiePref;

        },
        getCookiePref(option){
            return window.localStorage.getItem(STORAGE_KEY) === option;
        }
    },
};
</script>

<template>
    <div class="input-group">
        <fieldset class="ff-choice">
        <ul class="ff-choice__list">
            <li class="ff-choice__option ff-choice__option--radio" style="margin-left: 0px"
            >
                <input
                    type="radio"
                    name="cookie-consent-options"
                    value="all"
                    id="cookie-all"
                    @click="changeCookiePref('all')"
                    :checked="getCookiePref('all')"
                />
                <label class="ff-choice__label" label for="cookie-all">
                    {{ messageall}}
                </label>
            </li>
            <li class="ff-choice__option ff-choice__option--radio" style="margin-left: 0px">
                <input
                    type="radio"
                    name="cookie-consent-options"
                    value="all"
                    id="cookie-essential"
                    @click="changeCookiePref('essential')"
                    :checked="getCookiePref('essential')"
                />
                <label class="ff-choice__label" label for="cookie-essential" >
                    {{ messageessential }}
                </label>
            </li>
        </ul>
        </fieldset>

        <button class="btn btn--small" @click="saveChanges">
            {{ actionsave }}
        </button>
        <p style="display: none; border-left: green 4px solid; padding-left: 10px;" class="cookie-success-text">{{ actionsuccess }}</p>
        <p style="display: none; border-left: red 4px solid; padding-left: 10px;" class="cookie-fail-text">{{ actionfail }}</p>

    </div>
</template>

