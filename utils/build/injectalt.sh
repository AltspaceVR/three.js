if [ ! -f ../../build/three.min.js.bak ]; then
    cp ../../build/three.min.js ../../build/three.min.js.bak
fi
cp ../../build/three.min.js.bak ../../build/three.min.js
echo "document.write('<script src=\"js/injectalt.js\"></script>');" >> ../../build/three.min.js
