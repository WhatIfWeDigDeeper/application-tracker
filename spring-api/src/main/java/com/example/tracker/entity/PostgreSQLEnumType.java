package com.example.tracker.entity;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

public abstract class PostgreSQLEnumType<E extends Enum<E>> implements UserType<E> {

    private final Class<E> enumClass;

    protected PostgreSQLEnumType(Class<E> enumClass) {
        this.enumClass = enumClass;
    }

    protected abstract String toDbValue(E value);

    protected abstract E fromDbValue(String dbValue);

    @Override
    public int getSqlType() {
        return Types.VARCHAR;
    }

    @Override
    public Class<E> returnedClass() {
        return enumClass;
    }

    @Override
    public boolean equals(E x, E y) {
        return x == y;
    }

    @Override
    public int hashCode(E x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public E nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner)
            throws SQLException {
        String value = rs.getString(position);
        return rs.wasNull() ? null : fromDbValue(value);
    }

    @Override
    public void nullSafeSet(PreparedStatement st, E value, int index, SharedSessionContractImplementor session)
            throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, toDbValue(value), Types.OTHER);
        }
    }

    @Override
    public E deepCopy(E value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(E value) {
        return value == null ? null : toDbValue(value);
    }

    @Override
    @SuppressWarnings("unchecked")
    public E assemble(Serializable cached, Object owner) {
        return cached == null ? null : fromDbValue((String) cached);
    }
}
