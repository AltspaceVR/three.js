builddir="../../build"
injectionscript="document.write('<script src=\"js/injectalt.js\"></script>');"

if [ "$(grep injectalt $builddir/three.min.js)" = "" ]; then
    echo $injectionscript >> $builddir/three.min.js
fi

if [ "$(grep injectalt $builddir/three.js)" = "" ]; then
    echo $injectionscript >> $builddir/three.js
fi
