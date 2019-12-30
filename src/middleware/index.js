const beforeConduct = []

const beforeSubmit = []

function execute(info, type) {
    var arr = null
    switch (type) {
        case "conduct": arr = beforeConduct; break;
        case "submit": arr = beforeSubmit; break;
        default: arr = [];
    }
    try {
        dispatch(0)()
    } catch (e) {

    }
    function dispatch(i) {
        return () => {
            if (i < arr.length) {
                Promise.resolve(arr[i](info, dispatch(i + 1)))
            }
        }
    }
}

function executeConduct(info) {
    execute(info, "conduct")
}

function executeSubmit(info) {
    execute(info, "submit")
}

function use(func, type) {
    switch (type) {
        case "conduct": beforeConduct.push(func); break;
        case "submit": beforeSubmit.push(func); break;
        default: ;
    }
}

function useBeforeConduct(func) {
    if (typeof func === "function") {
        use(func, "conduct")
    }
}

function useBeforeSubmit(func) {
    if (typeof func === "function") {
        use(func, "submit")
    }
}

export { executeSubmit, executeConduct, useBeforeConduct, useBeforeSubmit }